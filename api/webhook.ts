import type { VercelRequest, VercelResponse } from '@vercel/node'

const N8N_WEBHOOK_URL = 'https://n8n.srv804235.hstgr.cloud/webhook/83e0a46f-e95a-47ee-803f-a3823f8adc21'

export const config = {
  api: {
    bodyParser: false,
  },
}

async function getRawBody(req: VercelRequest): Promise<Buffer> {
  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }
  return Buffer.concat(chunks)
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const rawBody = await getRawBody(req)

    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'authentication': process.env.WEBHOOK_AUTH || '',
        'content-type': req.headers['content-type'] || 'application/octet-stream',
      },
      body: rawBody,
    })

    const contentType = response.headers.get('content-type')
    const buffer = await response.arrayBuffer()

    res.setHeader('Content-Type', contentType || 'application/octet-stream')
    res.status(response.status).send(Buffer.from(buffer))
  } catch (error) {
    console.error('Webhook proxy error:', error)
    res.status(500).json({ error: 'Failed to proxy request' })
  }
}
