import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// Custom Connect: PASSi owns the onboarding & review flow.
// Operators (groups) do NOT get a Stripe dashboard — PASSi submits their
// bank account and identity info via API (full form is M4 work).
// This endpoint only creates the Stripe Custom account shell and records it.

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // ── Auth ─────────────────────────────────────────────────
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ── Role check — admin only ───────────────────────────────
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Forbidden — admin only' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
      apiVersion: '2024-06-20',
    })

    // ── Return existing account if already created ────────────
    const { data: existing } = await supabase
      .from('connected_accounts')
      .select('stripe_account_id, onboarding_complete')
      .eq('user_id', user.id)
      .single()

    if (existing?.stripe_account_id) {
      return new Response(
        JSON.stringify({
          stripe_account_id: existing.stripe_account_id,
          onboarding_complete: existing.onboarding_complete,
          status: 'existing',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ── Create Stripe Custom Connected Account ────────────────
    // PASSi is the platform — operators never access the Stripe dashboard.
    // PASSi collects identity + bank info and submits it via API (M4 onboarding form).
    const account = await stripe.accounts.create({
      type: 'custom',
      country: 'JP',
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      controller: {
        fees: { payer: 'application' },
        losses: { payments: 'application' },
        stripe_dashboard: { type: 'none' },
        requirement_collection: 'application',
      },
    })

    // ── Persist the account shell ─────────────────────────────
    await supabase
      .from('connected_accounts')
      .upsert(
        {
          user_id: user.id,
          stripe_account_id: account.id,
          onboarding_complete: false,
        },
        { onConflict: 'user_id' }
      )

    return new Response(
      JSON.stringify({
        stripe_account_id: account.id,
        onboarding_complete: false,
        status: 'created',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('stripe-connect-onboard error:', err)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
