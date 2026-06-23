import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

// Visual dummy: notification preferences have no backend in the original scope,
// so toggles are local state only (matches the prototype).
function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`relative w-12 h-6 rounded-full transition-colors ${on ? 'bg-[#9c7cf2]' : 'bg-[#d1d5db]'}`}>
      <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${on ? 'translate-x-6' : 'translate-x-0.5'}`} />
    </button>
  )
}

export function StaffNotificationSettings() {
  const navigate = useNavigate()
  const [timerVibration, setTimerVibration] = useState(true)
  const [timerSound, setTimerSound] = useState(false)
  const [eventNotification, setEventNotification] = useState(true)

  return (
    <div className="min-h-screen bg-[#faf9ff] pb-6">
      <div className="bg-white px-4 py-3 shadow-sm sticky top-0 z-10">
        <div className="flex items-center">
          <button onClick={() => navigate('/staff/settings')} className="flex items-center gap-2 py-2 pr-4 -ml-2">
            <ArrowLeft className="w-5 h-5 text-[#9c7cf2]" /><span className="text-base text-[#9c7cf2]">設定</span>
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="text-sm font-medium text-[#221d4e] mb-3">タイマー終了時</div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#221d4e]">バイブレーション</span>
              <Toggle on={timerVibration} onClick={() => setTimerVibration(!timerVibration)} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#221d4e]">サウンド</span>
              <Toggle on={timerSound} onClick={() => setTimerSound(!timerSound)} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#221d4e]">イベント開始の通知</span>
            <Toggle on={eventNotification} onClick={() => setEventNotification(!eventNotification)} />
          </div>
        </div>
      </div>
    </div>
  )
}
