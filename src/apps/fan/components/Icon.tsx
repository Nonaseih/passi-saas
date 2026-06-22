// Icon set ported 1:1 from the client prototype (fan-frontend/index.html `icon()`),
// so the fan app's icons match the prototype exactly rather than approximating with lucide.

export type IconName =
  | 'back' | 'bell' | 'cart' | 'search' | 'ticket' | 'card' | 'user' | 'home'
  | 'gift' | 'megaphone' | 'qr' | 'qrscan' | 'calendar' | 'info' | 'share'
  | 'logout' | 'plus' | 'minus' | 'filter'

const PATHS: Record<IconName, React.ReactNode> = {
  back: <><path d="M15 18l-6-6 6-6" /><path d="M21 12H9" /></>,
  bell: <><path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5" /><path d="M9 17a3 3 0 0 0 6 0" /></>,
  cart: <><circle cx="9" cy="20" r="1" /><circle cx="18" cy="20" r="1" /><path d="M3 4h2l2.4 10.2a1 1 0 0 0 1 .8h9.8a1 1 0 0 0 1-.8L21 7H7" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
  ticket: <><path d="M3 9a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2v-2a2 2 0 0 0 0-4Z" /><path d="M13 7v10" /></>,
  card: <><rect x="3" y="5" width="18" height="14" rx="3" /><path d="M3 10h18" /></>,
  user: <><path d="M20 21a8 8 0 1 0-16 0" /><circle cx="12" cy="8" r="4" /></>,
  home: <><path d="M3 11.5 12 4l9 7.5" /><path d="M5 10.5V20h14v-9.5" /></>,
  gift: <><path d="M20 12v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8" /><path d="M2 7h20v5H2z" /><path d="M12 22V7" /><path d="M12 7H7.5a2.5 2.5 0 1 1 0-5c3 0 4.5 5 4.5 5Z" /><path d="M12 7h4.5a2.5 2.5 0 1 0 0-5C13.5 2 12 7 12 7Z" /></>,
  megaphone: <><path d="M3 11v2a2 2 0 0 0 2 2h2l4 4V5L7 9H5a2 2 0 0 0-2 2Z" /><path d="M15 9.5a4.5 4.5 0 0 1 0 5" /><path d="M17.5 7a8 8 0 0 1 0 10" /></>,
  qr: <><rect x="3" y="3" width="6" height="6" rx="1" /><rect x="15" y="3" width="6" height="6" rx="1" /><rect x="3" y="15" width="6" height="6" rx="1" /><path d="M13 13h3" /><path d="M13 17h1" /><path d="M17 13h1" /><path d="M17 17h4" /><path d="M13 21h3" /><path d="M21 15v2" /></>,
  qrscan: <><rect x="3" y="3" width="5" height="5" rx="1" /><rect x="3" y="16" width="5" height="5" rx="1" /><rect x="16" y="3" width="5" height="5" rx="1" /><path d="M16 16h.01" /><path d="M16 19h.01" /><path d="M19 16h.01" /><path d="M19 19h.01" /><path d="M13 13h1" /><path d="M13 16v3" /><path d="M13 13v-1" /><path d="M10 13h-1" /></>,
  calendar: <><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4" /><path d="M8 2v4" /><path d="M3 10h18" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 10v6" /><path d="M12 7h.01" /></>,
  share: <><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="M8.6 13.5 15.4 17.5" /><path d="M15.4 6.5 8.6 10.5" /></>,
  logout: <><path d="M10 17l5-5-5-5" /><path d="M15 12H3" /><path d="M13 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5" /></>,
  plus: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
  minus: <><path d="M5 12h14" /></>,
  filter: <><path d="M22 3H2l8 9.46V19l4 2V12.46L22 3z" /></>,
}

export function Icon({ name, size = 20, className }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth={2}
      strokeLinecap="round" strokeLinejoin="round"
      className={className} aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  )
}
