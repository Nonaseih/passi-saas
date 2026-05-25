import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  // Handle CORS preflight
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

    // Init Supabase with service role (bypasses RLS)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Init Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
      apiVersion: '2024-06-20',
    })

    // Fetch ticket type + verify stock
    const { data: ticketType, error: ttError } = await supabase
      .from('ticket_types')
      .select('*, events(title)')
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

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'jpy',
            product_data: {
              name: ticketType.name,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              description: `${(ticketType as any).events?.title ?? ''} — ${ticketType.name}`,
            },
            unit_amount: ticketType.price,
          },
          quantity,
        },
      ],
      success_url: `${Deno.env.get('APP_URL')}/tickets?purchase=success`,
      cancel_url: `${Deno.env.get('APP_URL')}/purchase/${ticket_type_id}?cancelled=true`,
      metadata: {
        ticket_type_id,
        event_id,
        user_id,
        quantity: String(quantity),
      },
    })

    // Record pending payment (idempotency key = stripe session id)
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        user_id,
        ticket_type_id,
        stripe_session_id: session.id,
        amount: ticketType.price * quantity,
        quantity,
        status: 'pending',
      })

    if (paymentError) {
      console.error('Payment insert error:', paymentError)
      // Don't block — payment record will be upserted on webhook
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
