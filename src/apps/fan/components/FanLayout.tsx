import '../fan.css'
import { FanBottomNav } from './FanBottomNav'

interface Props {
  children: React.ReactNode
  hideNav?: boolean
  className?: string
}

export function FanLayout({ children, hideNav, className }: Props) {
  return (
    <div className="fan-app">
      <div className={`fan-screen${className ? ` ${className}` : ''}`}>
        {children}
        {!hideNav && <FanBottomNav />}
      </div>
    </div>
  )
}
