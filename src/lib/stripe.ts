import { loadStripe } from '@stripe/stripe-js'

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY

if (!stripePublishableKey) {
  console.warn('Missing VITE_STRIPE_PUBLISHABLE_KEY — payments will not work.')
}

// Singleton Stripe instance
export const stripePromise = loadStripe(stripePublishableKey ?? '')

// ── Checkout ─────────────────────────────────────────────────
/**
 * Redirect to Stripe Checkout.
 * The actual session is created server-side via Supabase Edge Function.
 */
export async function redirectToCheckout(sessionId: string) {
  const stripe = await stripePromise
  if (!stripe) throw new Error('Stripe failed to initialize')

  const { error } = await stripe.redirectToCheckout({ sessionId })
  if (error) throw new Error(error.message)
}
