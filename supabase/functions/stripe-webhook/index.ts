import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ⚠️  This function MUST NOT have CORS headers — Stripe calls it server-to-server

Deno.serve(async (req) => {
  const signature = req.headers.get('stripe-signature')
  const body = await req.text()

  if (!signature) {
    return new Response('Missing stripe-signature header', { status: 400 })
  }

  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
    apiVersion: '2024-06-20',
  })

  // ── Verify Webhook Signature ────────────────────────────────
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return new Response('Invalid signature', { status: 400 })
  }

  // Init Supabase (service role — bypasses RLS for ticket issuance)
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // ── Handle Events ───────────────────────────────────────────
  try {
    if (event.type === 'checkout.session.completed') {
      await handleCheckoutCompleted(supabase, event.data.object as Stripe.Checkout.Session)
    }

    if (event.type === 'payment_intent.payment_failed') {
      await handlePaymentFailed(supabase, event.data.object as Stripe.PaymentIntent)
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

// ── checkout.session.completed ──────────────────────────────
async function handleCheckoutCompleted(
  supabase: ReturnType<typeof createClient>,
  session: Stripe.Checkout.Session
) {
  const { ticket_type_id, event_id, user_id, quantity } = session.metadata ?? {}

  if (!ticket_type_id || !event_id || !user_id || !quantity) {
    throw new Error('Missing metadata in Stripe session')
  }

  const qty = parseInt(quantity, 10)

  // Idempotency check — skip if already processed
  const { data: existingPayment } = await supabase
    .from('payments')
    .select('id, status')
    .eq('stripe_session_id', session.id)
    .single()

  if (existingPayment?.status === 'paid') {
    console.log('Already processed, skipping:', session.id)
    return
  }

  // ── Transaction: update payment + issue tickets + decrement stock ──
  // 1. Update payment status
  const { error: paymentError } = await supabase
    .from('payments')
    .upsert({
      user_id,
      ticket_type_id,
      stripe_session_id: session.id,
      stripe_payment_intent_id: session.payment_intent as string,
      amount: session.amount_total ?? 0,
      quantity: qty,
      status: 'paid',
      paid_at: new Date().toISOString(),
    }, {
      onConflict: 'stripe_session_id',
    })

  if (paymentError) throw new Error(`Payment update failed: ${paymentError.message}`)

  // 2. Issue tickets (one row per ticket)
  const ticketRows = Array.from({ length: qty }).map(() => ({
    user_id,
    ticket_type_id,
    event_id,
    status: 'active',
    purchased_at: new Date().toISOString(),
  }))

  const { error: ticketError } = await supabase
    .from('tickets')
    .insert(ticketRows)

  if (ticketError) throw new Error(`Ticket insert failed: ${ticketError.message}`)

  // 3. Decrement stock (atomic with RPC to avoid race conditions)
  const { error: stockError } = await supabase.rpc('decrement_stock', {
    p_ticket_type_id: ticket_type_id,
    p_quantity: qty,
  })

  if (stockError) {
    // Non-fatal — log and continue (stock sync can be reconciled)
    console.error('Stock decrement error:', stockError)
  }

  console.log(`✅ Issued ${qty} tickets for user ${user_id}, event ${event_id}`)
}

// ── payment_intent.payment_failed ──────────────────────────
async function handlePaymentFailed(
  supabase: ReturnType<typeof createClient>,
  paymentIntent: Stripe.PaymentIntent
) {
  // Find the payment by payment_intent_id and mark as failed
  const { error } = await supabase
    .from('payments')
    .update({ status: 'failed' })
    .eq('stripe_payment_intent_id', paymentIntent.id)

  if (error) {
    console.error('Failed to update payment status:', error)
  }

  console.log(`❌ Payment failed for intent: ${paymentIntent.id}`)
}
