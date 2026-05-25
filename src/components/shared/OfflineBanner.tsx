import { Wifi, WifiOff, RefreshCw } from 'lucide-react'
import type { SyncResult } from '@/types'

interface OfflineBannerProps {
  isOnline: boolean
  syncing?: boolean
  lastSyncResult?: SyncResult | null
}

export function OfflineBanner({ isOnline, syncing, lastSyncResult }: OfflineBannerProps) {
  if (isOnline && !syncing && !lastSyncResult) return null

  if (!isOnline) {
    return (
      <div className="flex items-center gap-2 bg-yellow-500 px-4 py-2 text-white text-xs font-medium">
        <WifiOff size={14} />
        <span>オフラインモード — スキャンはローカルに保存されます</span>
      </div>
    )
  }

  if (syncing) {
    return (
      <div className="flex items-center gap-2 bg-blue-500 px-4 py-2 text-white text-xs font-medium">
        <RefreshCw size={14} className="animate-spin" />
        <span>オフラインデータを同期中...</span>
      </div>
    )
  }

  if (lastSyncResult) {
    const hasIssues = lastSyncResult.conflicts > 0 || lastSyncResult.errors > 0
    return (
      <div className={`flex items-center gap-2 px-4 py-2 text-white text-xs font-medium ${
        hasIssues ? 'bg-orange-500' : 'bg-green-600'
      }`}>
        <Wifi size={14} />
        <span>
          同期完了 {lastSyncResult.synced}件
          {lastSyncResult.conflicts > 0 && ` · 競合 ${lastSyncResult.conflicts}件`}
          {lastSyncResult.errors > 0 && ` · エラー ${lastSyncResult.errors}件`}
        </span>
      </div>
    )
  }

  return null
}
