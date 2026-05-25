import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Html5Qrcode } from 'html5-qrcode'
import { useAuth } from '@/contexts/AuthContext'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { OfflineBanner } from '@/components/shared/OfflineBanner'
import { supabase } from '@/lib/supabase'
import { parseQRPayload } from '@/lib/qr'
import { enqueueScan } from '@/lib/offline/db'
import { generateDeviceId, formatDate } from '@/lib/utils'
import { ArrowLeft, History, QrCode, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import type { QRPayload } from '@/types'

type ScanState = 'idle' | 'scanning' | 'validating' | 'confirm' | 'success' | 'error'

interface TicketInfo {
  id: string
  status: string
  ticket_type: { name: string }
  event: { title: string; date: string; venue: string }
  user: { display_name: string }
}

interface ScanError {
  type: 'used' | 'expired' | 'invalid' | 'wrong_event' | 'not_found' | 'unknown'
  message: string
}

export function StaffScanner() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const eventId = searchParams.get('event')

  const { isOnline, syncing, lastSyncResult } = useOnlineStatus()
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const [scanState, setScanState] = useState<ScanState>('idle')
  const [ticketInfo, setTicketInfo] = useState<TicketInfo | null>(null)
  const [pendingPayload, setPendingPayload] = useState<QRPayload | null>(null)
  const [scanError, setScanError] = useState<ScanError | null>(null)
  const [processing, setProcessing] = useState(false)

  const stopScanner = useCallback(async () => {
    if (scannerRef.current?.isScanning) {
      await scannerRef.current.stop()
    }
  }, [])

  const startScanner = useCallback(async () => {
    const el = document.getElementById('qr-reader')
    if (!el) return

    scannerRef.current = new Html5Qrcode('qr-reader')
    setScanState('scanning')

    try {
      await scannerRef.current.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => handleScanSuccess(decodedText),
        () => {} // ignore decode errors (camera noise)
      )
    } catch {
      setScanError({ type: 'unknown', message: 'カメラへのアクセスが拒否されました' })
      setScanState('error')
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    startScanner()
    return () => { stopScanner() }
  }, [startScanner, stopScanner])

  // ── QR Scan Handler ─────────────────────────────────────────
  async function handleScanSuccess(raw: string) {
    if (scanState !== 'scanning') return
    setScanState('validating')
    await stopScanner()

    // Parse QR payload
    const payload = parseQRPayload(raw)
    if (!payload) {
      setScanError({ type: 'invalid', message: '無効なQRコードです' })
      setScanState('error')
      return
    }

    // Validate event match
    if (eventId && payload.event_id !== eventId) {
      setScanError({ type: 'wrong_event', message: 'このイベントのチケットではありません' })
      setScanState('error')
      return
    }

    // Online: validate against DB immediately
    if (isOnline) {
      await validateOnline(payload)
    } else {
      // Offline: trust the QR and queue the scan
      await queueOfflineScan(payload)
    }
  }

  // ── Online Validation ───────────────────────────────────────
  async function validateOnline(payload: QRPayload) {
    try {
      const { data: ticket, error } = await supabase
        .from('tickets')
        .select(`
          id, status, qr_token,
          ticket_type:ticket_types(name),
          event:events(title, date, venue),
          user:users(display_name)
        `)
        .eq('id', payload.ticket_id)
        .single<TicketInfo & { qr_token: string; status: string }>()

      if (error || !ticket) {
        setScanError({ type: 'not_found', message: 'チケットが見つかりません' })
        setScanState('error')
        return
      }

      // Validate qr_token
      if (ticket.qr_token !== payload.qr_token) {
        setScanError({ type: 'invalid', message: '無効なQRトークンです' })
        setScanState('error')
        return
      }

      // Already used
      if (ticket.status === 'used') {
        setScanError({ type: 'used', message: 'このチケットは使用済みです' })
        setScanState('error')
        return
      }

      // Expired
      if (ticket.status === 'expired') {
        setScanError({ type: 'expired', message: 'このチケットは期限切れです' })
        setScanState('error')
        return
      }

      // Valid — show confirmation
      setTicketInfo(ticket as unknown as TicketInfo)
      setPendingPayload(payload)
      setScanState('confirm')
    } catch {
      setScanError({ type: 'unknown', message: 'エラーが発生しました。再試行してください。' })
      setScanState('error')
    }
  }

  // ── Offline Queue ───────────────────────────────────────────
  async function queueOfflineScan(payload: QRPayload) {
    if (!user) return
    try {
      await enqueueScan({
        id: crypto.randomUUID(),
        ticket_id: payload.ticket_id,
        staff_id: user.id,
        scanned_at: new Date().toISOString(),
        device_id: generateDeviceId(),
        sync_status: 'pending',
        created_locally_at: new Date().toISOString(),
      })
      setScanState('success')
      setTicketInfo(null) // No ticket details offline
    } catch {
      setScanError({ type: 'unknown', message: 'オフライン保存に失敗しました' })
      setScanState('error')
    }
  }

  // ── Mogiri Confirm ──────────────────────────────────────────
  async function confirmMogiri() {
    if (!pendingPayload || !user || processing) return
    setProcessing(true)

    try {
      // Optimistic lock: only update if still 'active'
      const { error } = await supabase
        .from('tickets')
        .update({
          status: 'used',
          used_at: new Date().toISOString(),
          used_by: user.id,
        } as never)
        .eq('id', pendingPayload.ticket_id)
        .eq('status', 'active')

      if (error) throw error

      // Insert scan log
      await supabase.from('scan_logs').insert({
        ticket_id: pendingPayload.ticket_id,
        staff_id: user.id,
        scanned_at: new Date().toISOString(),
        device_id: generateDeviceId(),
        offline_flag: false,
      } as never)

      setScanState('success')
    } catch {
      setScanError({ type: 'unknown', message: 'もぎり処理に失敗しました。再試行してください。' })
      setScanState('error')
    } finally {
      setProcessing(false)
    }
  }

  // ── Reset for next scan ─────────────────────────────────────
  function resetScanner() {
    setTicketInfo(null)
    setPendingPayload(null)
    setScanError(null)
    setScanState('idle')
    startScanner()
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <OfflineBanner isOnline={isOnline} syncing={syncing} lastSyncResult={lastSyncResult} />

      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3">
        <button onClick={() => navigate('/staff')} className="text-white/70 hover:text-white">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-base font-bold">QRスキャン</h1>
        <button
          onClick={() => navigate('/staff/history')}
          className="text-white/70 hover:text-white"
        >
          <History size={20} />
        </button>
      </header>

      {/* Camera view */}
      <div className="relative">
        <div id="qr-reader" className="w-full" />

        {/* Scanning overlay */}
        {scanState === 'scanning' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div className="border-2 border-primary rounded-lg w-64 h-64 relative">
              <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-lg" />
            </div>
            <p className="mt-4 text-sm text-white/70">QRコードをフレームに合わせてください</p>
          </div>
        )}

        {/* Validating */}
        {scanState === 'validating' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70">
            <div className="flex flex-col items-center gap-3">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="text-sm">チケットを確認中...</p>
            </div>
          </div>
        )}
      </div>

      {/* Confirm dialog */}
      {scanState === 'confirm' && ticketInfo && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/60">
          <div className="w-full rounded-t-2xl bg-white text-foreground p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                <QrCode size={20} className="text-green-600" />
              </div>
              <div>
                <p className="font-bold">チケット確認</p>
                <p className="text-xs text-muted-foreground">もぎりを実行しますか？</p>
              </div>
            </div>

            <div className="rounded-xl bg-muted p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">種別</span>
                <span className="font-semibold">{ticketInfo.ticket_type?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">イベント</span>
                <span className="font-semibold text-right max-w-[60%]">{ticketInfo.event?.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">日時</span>
                <span className="font-semibold">
                  {ticketInfo.event?.date ? formatDate(ticketInfo.event.date) : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">購入者</span>
                <span className="font-semibold">{ticketInfo.user?.display_name}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={resetScanner}
                className="flex-1 rounded-xl border py-3 text-sm font-medium"
              >
                キャンセル
              </button>
              <button
                onClick={confirmMogiri}
                disabled={processing}
                className="flex-1 rounded-xl bg-primary py-3 text-sm font-bold text-white disabled:opacity-50"
              >
                {processing ? '処理中...' : 'もぎる ✓'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success */}
      {scanState === 'success' && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-green-600 p-6 text-white">
          <CheckCircle size={80} className="mb-4" />
          <h2 className="text-2xl font-bold mb-2">
            {isOnline ? 'もぎり完了！' : 'オフライン保存完了'}
          </h2>
          <p className="text-sm text-green-100 text-center mb-8">
            {isOnline
              ? 'チケットを使用済みにしました'
              : 'オンライン復帰時に自動同期されます'}
          </p>
          <button
            onClick={resetScanner}
            className="rounded-xl bg-white text-green-700 px-8 py-3 font-bold text-sm"
          >
            次のスキャンへ
          </button>
        </div>
      )}

      {/* Error */}
      {scanState === 'error' && scanError && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background p-6">
          {scanError.type === 'used' ? (
            <AlertTriangle size={80} className="text-orange-500 mb-4" />
          ) : (
            <XCircle size={80} className="text-destructive mb-4" />
          )}
          <h2 className="text-xl font-bold mb-2 text-center">
            {scanError.type === 'used' ? '使用済みチケット' : 'スキャンエラー'}
          </h2>
          <p className="text-sm text-muted-foreground text-center mb-8">
            {scanError.message}
          </p>
          <button
            onClick={resetScanner}
            className="rounded-xl bg-primary text-primary-foreground px-8 py-3 font-bold text-sm"
          >
            再スキャン
          </button>
        </div>
      )}
    </div>
  )
}
