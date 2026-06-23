import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react'

const FAQS = [
  { id: '1', question: 'タイマーはどのように使いますか？', answer: 'タイマーは各メンバーのカードに表示されています。一時停止ボタンでタイマーを停止できます。タイマーが終了するとバイブレーションで通知されます。' },
  { id: '2', question: '整理番号はどこで確認できますか？', answer: '「整理番号」タブから全ての整理番号を確認できます。検索バーで特定の番号を検索することも可能です。' },
  { id: '3', question: '残り枚数が少なくなったら何か表示されますか？', answer: '残り3枚以下になると、残り枚数の数字が赤く表示されます。' },
  { id: '4', question: '通知設定を変更するには？', answer: '設定 > 通知設定から、タイマー終了時のバイブレーションやサウンド、イベント開始の通知をオン/オフできます。' },
]

export function StaffHelp() {
  const navigate = useNavigate()
  const [expandedId, setExpandedId] = useState<string | null>(null)

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
          <h2 className="text-sm font-medium text-[#221d4e] mb-2">使い方</h2>
          <div className="text-xs text-[#9892b3] space-y-2">
            <p>1. 進行管理タブで各メンバーのチェキ進行状況を確認</p>
            <p>2. タイマーで時間を管理</p>
            <p>3. 整理番号タブで待っているファンを確認</p>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-medium text-[#221d4e] mb-2 px-1">よくある質問</h2>
          <div className="space-y-2">
            {FAQS.map((faq) => {
              const isExpanded = expandedId === faq.id
              return (
                <div key={faq.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <button onClick={() => setExpandedId(isExpanded ? null : faq.id)} className="w-full p-4 flex items-center justify-between text-left hover:bg-[#faf9ff] transition-colors">
                    <span className="text-sm font-medium text-[#221d4e] flex-1 pr-2">{faq.question}</span>
                    {isExpanded ? <ChevronUp className="w-5 h-5 text-[#9892b3] flex-shrink-0" /> : <ChevronDown className="w-5 h-5 text-[#9892b3] flex-shrink-0" />}
                  </button>
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-[#ebe8f6] pt-3">
                      <p className="text-xs text-[#221d4e] leading-relaxed">{faq.answer}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h2 className="text-sm font-medium text-[#221d4e] mb-2">お問い合わせ</h2>
          <p className="text-xs text-[#9892b3] mb-3">問題が解決しない場合は、運営スタッフにお問い合わせください。</p>
          <div className="text-xs text-[#9c7cf2]">support@example.com</div>
        </div>
      </div>
    </div>
  )
}
