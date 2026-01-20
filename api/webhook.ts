import type { VercelRequest, VercelResponse } from '@vercel/node'

const N8N_WEBHOOK_URL = 'https://n8n.srv804235.hstgr.cloud/webhook/83e0a46f-e95a-47ee-803f-a3823f8adc21'
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY

const MAX_BODY_BYTES = 10 * 1024 * 1024
const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX = 30

type RateLimitEntry = {
  count: number
  resetAt: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

export const config = {
  api: {
    bodyParser: false,
  },
}

function getClientIp(req: VercelRequest) {
  const forwarded = req.headers['x-forwarded-for']
  if (typeof forwarded === 'string' && forwarded.trim().length > 0) {
    return forwarded.split(',')[0].trim()
  }
  return req.socket?.remoteAddress || 'unknown'
}

function enforceRateLimit(ip: string) {
  const now = Date.now()
  const entry = rateLimitStore.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return
  }
  if (entry.count >= RATE_LIMIT_MAX) {
    throw new Error('RATE_LIMITED')
  }
  entry.count += 1
}

async function getRawBody(req: VercelRequest, maxBytes: number): Promise<Buffer> {
  const chunks: Buffer[] = []
  let total = 0
  for await (const chunk of req) {
    const bufferChunk = typeof chunk === 'string' ? Buffer.from(chunk) : chunk
    total += bufferChunk.length
    if (total > maxBytes) {
      throw new Error('PAYLOAD_TOO_LARGE')
    }
    chunks.push(bufferChunk)
  }
  return Buffer.concat(chunks)
}

async function validateUser(req: VercelRequest) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('UNAUTHORIZED')
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('SUPABASE_NOT_CONFIGURED')
  }

  const token = authHeader.slice('Bearer '.length)
  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      authorization: `Bearer ${token}`,
      apikey: SUPABASE_ANON_KEY,
    },
  })

  if (!response.ok) {
    throw new Error('UNAUTHORIZED')
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    enforceRateLimit(getClientIp(req))

    const contentType = req.headers['content-type'] || ''
    if (!contentType.startsWith('multipart/form-data')) {
      return res.status(415).json({ error: 'Unsupported content type' })
    }

    const contentLength = req.headers['content-length']
    if (contentLength && Number(contentLength) > MAX_BODY_BYTES) {
      return res.status(413).json({ error: 'Payload too large' })
    }

    await validateUser(req)

    const rawBody = await getRawBody(req, MAX_BODY_BYTES)

    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'authentication': process.env.WEBHOOK_AUTH || '',
        'content-type': contentType,
      },
      body: rawBody,
    })

    const responseContentType = response.headers.get('content-type')
    const buffer = await response.arrayBuffer()

    res.setHeader('Content-Type', responseContentType || 'application/octet-stream')
    res.status(response.status).send(Buffer.from(buffer))
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'PAYLOAD_TOO_LARGE') {
        return res.status(413).json({ error: 'Payload too large' })
      }
      if (error.message === 'RATE_LIMITED') {
        return res.status(429).json({ error: 'Too many requests' })
      }
      if (error.message === 'UNAUTHORIZED') {
        return res.status(401).json({ error: 'Unauthorized' })
      }
      if (error.message === 'SUPABASE_NOT_CONFIGURED') {
        return res.status(500).json({ error: 'Auth not configured' })
      }
    }
    console.error('Webhook proxy error:', error)
    res.status(500).json({ error: 'Failed to proxy request' })
  }
}
