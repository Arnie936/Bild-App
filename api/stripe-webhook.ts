import type { VercelRequest, VercelResponse } from '@vercel/node'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia',
})

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || ''
const SUPABASE_URL = process.env.SUPABASE_URL || ''
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

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

  if (!STRIPE_WEBHOOK_SECRET || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing required environment variables')
    return res.status(500).json({ error: 'Server configuration error' })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  try {
    const rawBody = await getRawBody(req)
    const signature = req.headers['stripe-signature'] as string

    if (!signature) {
      return res.status(400).json({ error: 'Missing stripe-signature header' })
    }

    const event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      STRIPE_WEBHOOK_SECRET
    )

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        // Email kann an verschiedenen Stellen sein
        const customerEmail = session.customer_email || session.customer_details?.email

        console.log('Checkout session completed:', {
          mode: session.mode,
          subscription: session.subscription,
          customer: session.customer,
          customerEmail,
        })

        if (session.mode === 'subscription' && session.subscription) {
          if (!customerEmail) {
            console.error('No customer email found in session')
            break
          }

          // Find user by email
          const { data: userData, error: userError } = await supabase.auth.admin.listUsers()

          if (userError) {
            console.error('Error fetching users:', userError.message)
            break
          }

          const user = userData.users.find(u => u.email?.toLowerCase() === customerEmail.toLowerCase())

          if (!user) {
            console.error('User not found for email:', customerEmail)
            break
          }

          // Get subscription details
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string)

          // Upsert subscription
          const { error: upsertError } = await supabase
            .from('subscriptions')
            .upsert({
              user_id: user.id,
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: subscription.id,
              status: 'active',
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            }, {
              onConflict: 'user_id'
            })

          if (upsertError) {
            console.error('Error upserting subscription:', upsertError.message)
          }
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription

        const status = subscription.status === 'active' ? 'active'
          : subscription.status === 'past_due' ? 'past_due'
          : 'inactive'

        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({
            status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id)

        if (updateError) {
          console.error('Error updating subscription:', updateError.message)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription

        const { error: deleteError } = await supabase
          .from('subscriptions')
          .update({ status: 'cancelled' })
          .eq('stripe_subscription_id', subscription.id)

        if (deleteError) {
          console.error('Error cancelling subscription:', deleteError.message)
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice

        if (invoice.subscription) {
          const { error: failError } = await supabase
            .from('subscriptions')
            .update({ status: 'past_due' })
            .eq('stripe_subscription_id', invoice.subscription as string)

          if (failError) {
            console.error('Error updating failed payment:', failError.message)
          }
        }
        break
      }
    }

    return res.status(200).json({ received: true })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Stripe webhook error:', errorMessage)
    return res.status(400).json({ error: 'Webhook error' })
  }
}
