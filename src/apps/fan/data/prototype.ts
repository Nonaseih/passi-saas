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

// ── Points system (visual dummy — Phase 2 feature, no backend) ──────────────
export const GROUPS = [
  { id: 'hzme', name: 'HzMe', points: 180, cardExpiry: '2026年12月31日' },
  { id: 'appare', name: 'Appare!', points: 350, cardExpiry: '2026年09月30日' },
  { id: 'myojou', name: 'myojou', points: 80, cardExpiry: '2027年03月31日' },
] as const

export interface Reward { id: string; label: string; points: number; status: string; desc: string; expiry: string | null }
export const REWARDS: Reward[] = [
  { id: 'r30', label: 'サインありチェキ券', points: 30, status: '達成済み', desc: '当日のみ利用できる特典券です。', expiry: '2026/08/31' },
  { id: 'r50', label: '2ショット写メ券', points: 50, status: '達成済み', desc: '利用時はスタッフ確認が必要です。', expiry: '2026/08/31' },
  { id: 'r100', label: '動画チェキ券', points: 100, status: '達成済み', desc: '30秒以内の撮影特典です。', expiry: '2026/08/31' },
  { id: 'r150', label: 'お手紙', points: 150, status: '達成済み', desc: 'ニックネームと受け取り方法の入力が必要です。', expiry: '2026/08/31' },
  { id: 'r200', label: '宿題チェキ券', points: 200, status: '未達成', desc: '後日受け取りの特典券です。', expiry: null },
]

export interface PointHistoryRow { date: string; label: string; points: number | null; type: 'plus' | 'used' }
export const POINT_HISTORY: PointHistoryRow[] = [
  { date: '2024/05/18 13:05', label: 'サインありチェキ券 購入', points: 2, type: 'plus' },
  { date: '2024/05/16 18:40', label: '動画チェキ券 使用', points: null, type: 'used' },
  { date: '2024/05/03 14:20', label: '2ショット写メ券 購入', points: 5, type: 'plus' },
  { date: '2024/04/28 16:00', label: 'サインありチェキ券 使用', points: null, type: 'used' },
  { date: '2024/04/15 18:45', label: '動画チェキ券 購入', points: 3, type: 'plus' },
  { date: '2024/04/08 13:10', label: 'お手紙 使用', points: null, type: 'used' },
  { date: '2024/03/22 15:50', label: 'サインありチェキ券 購入', points: 2, type: 'plus' },
  { date: '2024/03/15 17:30', label: '動画チェキ券 購入', points: 3, type: 'plus' },
]
