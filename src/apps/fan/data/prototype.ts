// Static demo data ported verbatim from the client prototype (fan-frontend/index.html).
// Used to reproduce the prototype's screens 1:1 for the client's 確認用 group.
// NOTE: groups / members / cart / points are visual dummies only — no backend.
// Those remain Phase-2 (separately quoted) features.

export interface PurchaseEvent {
  id: string
  group: string
  date: string   // YYYY/MM/DD
  time: string   // HH:mm
  title: string
  venue: string
  status: string
  selling: boolean
}

export const SEARCH_GROUPS = [
  { id: 'hzme', name: 'HzMe' },
  { id: 'appare', name: 'Appare!' },
  { id: 'myojou', name: 'myojou' },
] as const

const todayStr = (() => {
  const d = new Date()
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
})()
const soonTime = (() => {
  const d = new Date(Date.now() + 2 * 60 * 60 * 1000)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
})()

export const PURCHASE_EVENTS: PurchaseEvent[] = [
  { id: 'hzme-e1', group: 'HzMe', date: '2026/05/11', time: '10:00', title: 'HzMe 定期公演 特典会', venue: '渋谷ストリームホール', status: '販売中', selling: true },
  { id: 'hzme-e2', group: 'HzMe', date: '2026/05/24', time: '16:30', title: 'HzMe 週末特典会', venue: '白金高輪 SELENE b2', status: '販売前', selling: false },
  { id: 'appare-e1', group: 'Appare!', date: todayStr, time: soonTime, title: 'Appare! リリースイベント', venue: '池袋 harevutai', status: '販売前', selling: false },
  { id: 'appare-e2', group: 'Appare!', date: '2026/05/31', time: '18:00', title: 'Appare! 対バン終演後特典会', venue: '恵比寿LIQUIDROOM', status: '販売前', selling: false },
  { id: 'myojou-e1', group: 'myojou', date: '2026/05/21', time: '12:30', title: 'myojou チェキ会', venue: '横浜ランドマークホール', status: '販売前', selling: false },
  { id: 'myojou-e2', group: 'myojou', date: '2026/06/02', time: '17:00', title: 'myojou ワンマン後特典会', venue: 'Spotify O-WEST', status: '販売前', selling: false },
]

// The one real, payable ticket type (テストライブ2026 / 2ショットチェキ券).
// Prototype purchase CTAs point here so the real Stripe flow stays reachable.
export const REAL_TICKET_TYPE_ID = 'c4d9d0ad-edc5-4e20-b36b-8c32a1892ab9'
