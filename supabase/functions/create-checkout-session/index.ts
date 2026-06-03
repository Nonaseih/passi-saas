import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// PassI platform fee: 0.9% (Stripe's 3.6% paid separately by operator = 4.5% total)
const PLATFORM_FEE_RATE = 0.009

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { ticket_type_id, event_id, quantity, user_id } = await req.json()

    if (!ticket_type_id || !event_id || !quantity || !user_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
      apiVersion: '2024-06-20',
    })

    // ── Fetch ticket type + event (need created_by for Connect routing) ──
    const { data: ticketType, error: ttError } = await supabase
      .from('ticket_types')
      .select('*, events(id, title, created_by)')
      .eq('id', ticket_type_id)
      .single()

    if (ttError || !ticketType) {
      return new Response(
        JSON.stringify({ error: 'Ticket type not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (ticketType.stock_remaining < quantity) {
      return new Response(
        JSON.stringify({ error: '在庫が不足しています' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ── Resolve operator's connected Stripe account ───────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const operatorUserId = (ticketType as any).events?.created_by
    let connectedAccountId: string | null = null

    if (operatorUserId) {
      const { data: connected } = await supabase
        .from('connected_accounts')
        .select('stripe_account_id, onboarding_complete')
        .eq('user_id', operatorUserId)
        .single()

      if (connected?.onboarding_complete && connected.stripe_account_id) {
        connectedAccountId = connected.stripe_account_id
      }
    }

    if (!connectedAccountId) {
      return new Response(
        JSON.stringify({ error: 'グループのStripe連携が未完了です。管理者にお問い合わせください。' }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ── Build checkout session (Direct Charge on connected account) ──
    const totalAmount = ticketType.price * quantity
    // JPY has no sub-units — amount is already in yen
    const applicationFeeAmount = Math.round(totalAmount * PLATFORM_FEE_RATE)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eventTitle = (ticketType as any).events?.title ?? ''

    const session = await stripe.checkout.sessions.create(
      {
        payment_method_types: ['card'],
        mode: 'payment',
        line_items: [
          {
            price_data: {
              currency: 'jpy',
              product_data: {
                name: ticketType.name,
                description: `${eventTitle} — ${ticketType.name}`,
              },
              unit_amount: ticketType.price,
            },
            quantity,
          },
        ],
        payment_intent_data: {
          application_fee_amount: applicationFeeAmount,
        },
        success_url: `${Deno.env.get('APP_URL')}/tickets?purchase=success`,
        cancel_url:  `${Deno.env.get('APP_URL')}/purchase/${ticket_type_id}?cancelled=true`,
        metadata: {
          ticket_type_id,
          event_id,
          user_id,
          quantity: String(quantity),
          stripe_account_id: connectedAccountId,
        },
      },
      // Direct Charge — session lives on the connected account
      { stripeAccount: connectedAccountId }
    )

    // ── Record pending payment ────────────────────────────────
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        user_id,
        ticket_type_id,
        stripe_session_id: session.id,
        stripe_account_id: connectedAccountId,
        amount: totalAmount,
        quantity,
        status: 'pending',
      })

    if (paymentError) {
      console.error('Payment insert error:', paymentError)
      // Non-fatal — webhook will upsert on success
    }

    return new Response(
      JSON.stringify({ url: session.url, session_id: session.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('create-checkout-session error:', err)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
