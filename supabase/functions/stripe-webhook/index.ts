import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ⚠️  No CORS headers — Stripe calls this server-to-server

Deno.serve(async (req) => {
  const signature = req.headers.get('stripe-signature')
  const body = await req.text()

  if (!signature) {
    return new Response('Missing stripe-signature header', { status: 400 })
  }

  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
    apiVersion: '2024-06-20',
  })

  // ── Verify signature ─────────────────────────────────────────
  // Connect platform webhooks use STRIPE_CONNECT_WEBHOOK_SECRET.
  // Fallback to STRIPE_WEBHOOK_SECRET for direct account webhooks (dev/test).
  let event: Stripe.Event
  const connectSecret  = Deno.env.get('STRIPE_CONNECT_WEBHOOK_SECRET')
  const accountSecret  = Deno.env.get('STRIPE_WEBHOOK_SECRET')

  let verified = false
  for (const secret of [connectSecret, accountSecret]) {
    if (!secret) continue
    try {
      event = stripe.webhooks.constructEvent(body, signature, secret)
      verified = true
      break
    } catch {
      // try next
    }
  }

  if (!verified) {
    console.error('Webhook signature verification failed')
    return new Response('Invalid signature', { status: 400 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // ── Handle events ────────────────────────────────────────────
  try {
    // event.account is present when the event originated from a connected account
    const connectedAccountId = (event! as Stripe.Event & { account?: string }).account ?? null

    if (event!.type === 'checkout.session.completed') {
      await handleCheckoutCompleted(
        supabase,
        event!.data.object as Stripe.Checkout.Session,
        connectedAccountId
      )
    }

    if (event!.type === 'payment_intent.payment_failed') {
      await handlePaymentFailed(supabase, event!.data.object as Stripe.PaymentIntent)
    }

    // Mark operator onboarding complete when their account is fully set up
    if (event!.type === 'account.updated' && connectedAccountId) {
      await handleAccountUpdated(supabase, event!.data.object as Stripe.Account, connectedAccountId)
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Webhook handler error:', err)
    return new Response('Handler error', { status: 500 })
  }
})

// ── checkout.session.completed ────────────────────────────────
async function handleCheckoutCompleted(
  supabase: ReturnType<typeof createClient>,
  session: Stripe.Checkout.Session,
  connectedAccountId: string | null
) {
  const { ticket_type_id, event_id, user_id, quantity } = session.metadata ?? {}

  if (!ticket_type_id || !event_id || !user_id || !quantity) {
    throw new Error('Missing metadata in Stripe session')
  }

  const qty = parseInt(quantity, 10)

  // Idempotency — skip if already processed
  const { data: existingPayment } = await supabase
    .from('payments')
    .select('id, status')
    .eq('stripe_session_id', session.id)
    .single()

  if (existingPayment?.status === 'paid') {
    console.log('Already processed, skipping:', session.id)
    return
  }

  // 1. Update / create payment record
  const { error: paymentError } = await supabase
    .from('payments')
    .upsert(
      {
        user_id,
        ticket_type_id,
        stripe_session_id: session.id,
        stripe_payment_intent_id: session.payment_intent as string,
        stripe_account_id: connectedAccountId,
        amount: session.amount_total ?? 0,
        quantity: qty,
        status: 'paid',
        paid_at: new Date().toISOString(),
      },
      { onConflict: 'stripe_session_id' }
    )

  if (paymentError) throw new Error(`Payment update failed: ${paymentError.message}`)

  // 2. Issue one ticket row per unit
  const ticketRows = Array.from({ length: qty }).map(() => ({
    user_id,
    ticket_type_id,
    event_id,
    status: 'active',
    purchased_at: new Date().toISOString(),
  }))

  const { error: ticketError } = await supabase.from('tickets').insert(ticketRows)
  if (ticketError) throw new Error(`Ticket insert failed: ${ticketError.message}`)

  // 3. Atomic stock decrement
  const { error: stockError } = await supabase.rpc('decrement_stock', {
    p_ticket_type_id: ticket_type_id,
    p_quantity: qty,
  })

  if (stockError) {
    console.error('Stock decrement error (non-fatal):', stockError)
  }

  console.log(`✅ Issued ${qty} tickets — user ${user_id}, event ${event_id}, account ${connectedAccountId}`)
}

// ── payment_intent.payment_failed ────────────────────────────
async function handlePaymentFailed(
  supabase: ReturnType<typeof createClient>,
  paymentIntent: Stripe.PaymentIntent
) {
  const { error } = await supabase
    .from('payments')
    .update({ status: 'failed' })
    .eq('stripe_payment_intent_id', paymentIntent.id)

  if (error) console.error('Failed to update payment status:', error)
  console.log(`❌ Payment failed — intent ${paymentIntent.id}`)
}

// ── account.updated (onboarding completion) ───────────────────
async function handleAccountUpdated(
  supabase: ReturnType<typeof createClient>,
  account: Stripe.Account,
  stripeAccountId: string
) {
  const isComplete =
    account.charges_enabled &&
    account.payouts_enabled &&
    account.details_submitted

  if (isComplete) {
    const { error } = await supabase
      .from('connected_accounts')
      .update({ onboarding_complete: true })
      .eq('stripe_account_id', stripeAccountId)

    if (error) console.error('Failed to mark onboarding complete:', error)
    else console.log(`✅ Onboarding complete for account ${stripeAccountId}`)
  }
}
