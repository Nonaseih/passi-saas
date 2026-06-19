#!/usr/bin/env node
// ============================================================
// One-off helper — TEST MODE ONLY
//
// Drives a Stripe Connect CUSTOM account (country=JP, individual)
// through onboarding via the API using Stripe's documented test
// fixtures (https://docs.stripe.com/connect/testing), then flips
// connected_accounts.onboarding_complete in Supabase directly.
//
// This exists because create-checkout-session 402s with
// "グループのStripe連携が未完了です" until onboarding_complete is
// true, and the real onboarding form (collecting an operator's
// actual bank/identity info) is M4 work that doesn't exist yet.
// This script is a stopgap to unblock test purchases now.
//
// Run it yourself — it needs your own Stripe TEST secret key and
// Supabase service role key, which never leave your machine.
//
// Usage:
//   STRIPE_SECRET_KEY=sk_test_... \
//   SUPABASE_URL=https://xxxx.supabase.co \
//   SUPABASE_SERVICE_ROLE_KEY=eyJ... \
//   OPERATOR_EMAIL=fortunestephen720@gmail.com \
//   node complete-stripe-test-onboarding.mjs
//
// I haven't been able to run this myself (no credentials in this
// environment) — review the field values below against Stripe's
// current testing docs before running, and read the printed
// account status at the end to see what (if anything) Stripe
// still considers missing.
// ============================================================

function requireEnv(name) {
  const v = process.env[name]
  if (!v) {
    console.error(`Missing required env var: ${name}`)
    process.exit(1)
  }
  return v
}

const STRIPE_SECRET_KEY = requireEnv('STRIPE_SECRET_KEY')
const SUPABASE_URL = requireEnv('SUPABASE_URL')
const SERVICE_KEY = requireEnv('SUPABASE_SERVICE_ROLE_KEY')
const OPERATOR_EMAIL = process.env.OPERATOR_EMAIL || 'fortunestephen720@gmail.com'

if (!STRIPE_SECRET_KEY.startsWith('sk_test_')) {
  console.error('Refusing to run: STRIPE_SECRET_KEY is not a test key (sk_test_...). This script only uses Stripe test-mode fixtures and must never run against a live key.')
  process.exit(1)
}

const STRIPE_API = 'https://api.stripe.com/v1'
const STRIPE_VERSION = '2024-06-20' // matches supabase/functions/*

function flattenToParams(obj, prefix = '') {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined || value === null) continue
    const paramKey = prefix ? `${prefix}[${key}]` : key
    if (typeof value === 'object' && !Array.isArray(value)) {
      for (const [k, v] of flattenToParams(value, paramKey)) params.append(k, v)
    } else {
      params.append(paramKey, String(value))
    }
  }
  return params
}

async function stripeRequest(method, path, body, { stripeAccount } = {}) {
  const headers = {
    Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
    'Stripe-Version': STRIPE_VERSION,
  }
  if (stripeAccount) headers['Stripe-Account'] = stripeAccount
  if (!(body instanceof FormData)) headers['Content-Type'] = 'application/x-www-form-urlencoded'

  const res = await fetch(`${STRIPE_API}${path}`, { method, headers, body })
  const json = await res.json()
  if (!res.ok) {
    throw new Error(`Stripe ${method} ${path} failed: ${JSON.stringify(json.error ?? json)}`)
  }
  return json
}

async function supabaseRequest(method, path, body, extraHeaders = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    method,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      ...extraHeaders,
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    throw new Error(`Supabase ${method} ${path} failed (${res.status}): ${await res.text()}`)
  }
  return res.status === 204 ? null : res.json()
}

async function main() {
  console.log(`Looking up operator user by email: ${OPERATOR_EMAIL}`)
  const users = await supabaseRequest('GET', `/users?email=eq.${encodeURIComponent(OPERATOR_EMAIL)}&select=id,display_name`)
  if (!users.length) throw new Error(`No user found with email ${OPERATOR_EMAIL}`)
  const userId = users[0].id
  console.log(`Found user ${userId} (${users[0].display_name})`)

  const existingRows = await supabaseRequest('GET', `/connected_accounts?user_id=eq.${userId}&select=*`)
  let accountId = existingRows[0]?.stripe_account_id

  if (!accountId) {
    console.log('No connected_accounts row yet — creating Stripe Custom account...')
    const account = await stripeRequest('POST', '/accounts', flattenToParams({
      type: 'custom',
      country: 'JP',
      capabilities: { card_payments: { requested: true }, transfers: { requested: true } },
      controller: {
        fees: { payer: 'application' },
        losses: { payments: 'application' },
        stripe_dashboard: { type: 'none' },
        requirement_collection: 'application',
      },
    }))
    accountId = account.id
    await supabaseRequest('POST', '/connected_accounts', {
      user_id: userId,
      stripe_account_id: accountId,
      onboarding_complete: false,
    }, { Prefer: 'resolution=merge-duplicates' })
    console.log(`Created Stripe account ${accountId}`)
  } else {
    console.log(`Reusing existing Stripe account ${accountId}`)
  }

  console.log('Uploading dummy identity document (test mode — Stripe does not inspect file content)...')
  const fileForm = new FormData()
  fileForm.append('purpose', 'identity_document')
  fileForm.append('file', new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xd9])], { type: 'image/jpeg' }), 'test-id.jpg')
  const file = await stripeRequest('POST', '/files', fileForm, { stripeAccount: accountId })
  console.log(`Uploaded file ${file.id}`)

  console.log('Submitting JP individual + bank info using Stripe test fixtures...')
  // Test fixture values are from https://docs.stripe.com/connect/testing —
  // dob 1902-01-01 / phone 0000000000 trigger immediate test-mode verification,
  // and bank_code 1100 / branch_code 000 / account_number 0001234 is Stripe's
  // documented "payout succeeds" JP test account.
  await stripeRequest('POST', `/accounts/${accountId}`, flattenToParams({
    individual: {
      first_name_kana: 'タロウ',
      last_name_kana: 'パスアイ',
      first_name_kanji: '太郎',
      last_name_kanji: 'パスアイ',
      gender: 'male',
      dob: { day: 1, month: 1, year: 1902 },
      phone: '0000000000',
      email: OPERATOR_EMAIL,
      address_kana: {
        country: 'JP', postal_code: '1500001', state: 'ﾄｳｷﾖｳﾄ', city: 'ｼﾌﾞﾔ',
        town: 'ｼﾞﾝｸﾞｳﾏｴ 1-', line1: '5-8', line2: 'ｼﾞﾝｸﾞｳﾏｴﾀﾜｰﾋﾞﾙﾃﾞｨﾝｸﾞ22F',
      },
      address_kanji: {
        country: 'JP', postal_code: '１５００００１', state: '東京都', city: '渋谷区',
        town: '神宮前　１丁目', line1: '５－８', line2: '神宮前タワービルディング22F',
      },
      verification: { document: { front: file.id, back: file.id } },
    },
    business_profile: {
      mcc: '7929',
      // Stripe rejects localhost as a business URL — use a public placeholder
      // for the test account (this is not the operator's real site).
      url: 'https://passi-saas.example.com',
      product_description: 'アイドルグループ特典券（デジタルチェキ券）の販売',
    },
    tos_acceptance: {
      date: Math.floor(Date.now() / 1000),
      ip: '127.0.0.1',
      user_agent: 'PassI-test-onboarding-script/1.0',
    },
    external_account: {
      object: 'bank_account',
      country: 'JP',
      currency: 'jpy',
      account_holder_name: 'ﾊﾟｽｱｲ',
      bank_code: '1100',
      branch_code: '000',
      account_number: '0001234',
    },
  }))

  const account = await stripeRequest('GET', `/accounts/${accountId}`)
  console.log('--- Account status ---')
  console.log({
    id: account.id,
    charges_enabled: account.charges_enabled,
    payouts_enabled: account.payouts_enabled,
    details_submitted: account.details_submitted,
    currently_due: account.requirements?.currently_due,
    eventually_due: account.requirements?.eventually_due,
  })

  const complete = account.charges_enabled && account.payouts_enabled && account.details_submitted
  if (complete) {
    await supabaseRequest('PATCH', `/connected_accounts?user_id=eq.${userId}`, { onboarding_complete: true })
    console.log('✅ onboarding_complete set to true in Supabase — checkout should work now.')
  } else {
    console.log('⚠️  Account is not fully verified yet — see currently_due/eventually_due above.')
    console.log('   Stripe sometimes finishes test-mode verification asynchronously (a few seconds);')
    console.log('   the real account.updated webhook (stripe-webhook/index.ts) will flip')
    console.log('   onboarding_complete automatically once it does. Re-run this script to check again.')
  }
}

main().catch(err => {
  console.error('FAILED:', err.message)
  process.exit(1)
})
