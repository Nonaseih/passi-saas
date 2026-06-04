import { ChevronLeft } from 'lucide-react'

interface Props {
  title: string
  centered?: boolean
  onBack?: () => void
  right?: React.ReactNode
}

export function FanTopbar({ title, centered, onBack, right }: Props) {
  return (
    <div className={`topbar${centered ? ' center-title' : ''}`}>
      {onBack ? (
        <button className="icon-btn" onClick={onBack} aria-label="戻る">
          <ChevronLeft size={20} />
        </button>
      ) : (
        <div style={{ width: 36 }} />
      )}
      <div className="topbar__title">{title}</div>
      {right ?? <div style={{ width: 36 }} />}
    </div>
  )
}
