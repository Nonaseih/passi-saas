import { useRef, useEffect } from 'react'

interface Props {
  used: boolean
  onUse: () => void
  label?: string
  successLabel?: string
}

export function SlideToUse({
  used,
  onUse,
  label = '右へスライドして使用済みにする',
  successLabel = '✓ 使用済みにしました',
}: Props) {
  const ctaRef = useRef<HTMLDivElement>(null)
  const thumbRef = useRef<HTMLSpanElement>(null)
  const fillRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const cta = ctaRef.current
    const thumb = thumbRef.current
    const fill = fillRef.current
    if (!cta || !thumb || !fill || used) return

    const THRESHOLD = 0.72
    let dragging = false
    let startX = 0
    let thumbStart = 0
    let maxSlide = 0

    function getClientX(e: MouseEvent | TouchEvent) {
      return 'touches' in e ? e.touches[0].clientX : e.clientX
    }

    function onStart(e: MouseEvent | TouchEvent) {
      const thumbRect = thumb.getBoundingClientRect()
      const cx = getClientX(e)
      if (Math.abs(cx - thumbRect.left - thumbRect.width / 2) > thumbRect.width) return
      dragging = true
      startX = cx
      thumbStart = parseFloat(getComputedStyle(thumb).left) || 5
      maxSlide = cta.getBoundingClientRect().width - thumbRect.width - 10
      cta.classList.add('swiping')
      e.preventDefault()
    }

    function onMove(e: MouseEvent | TouchEvent) {
      if (!dragging) return
      e.preventDefault()
      const cx = getClientX(e)
      const newLeft = Math.max(thumbStart, Math.min(thumbStart + (cx - startX), thumbStart + maxSlide))
      thumb.style.left = newLeft + 'px'
      fill.style.transform = `scaleX(${(newLeft - thumbStart) / maxSlide})`
    }

    function onEnd() {
      if (!dragging) return
      dragging = false
      cta.classList.remove('swiping')
      const progress = (parseFloat(thumb.style.left || String(thumbStart)) - thumbStart) / maxSlide

      if (progress >= THRESHOLD) {
        thumb.style.transition = 'left 0.22s cubic-bezier(0.22,1,0.36,1)'
        fill.style.transition = 'transform 0.22s cubic-bezier(0.22,1,0.36,1)'
        thumb.style.left = (thumbStart + maxSlide) + 'px'
        fill.style.transform = 'scaleX(1)'
        setTimeout(() => {
          thumb.style.transition = ''
          fill.style.transition = ''
          onUse()
        }, 220)
      } else {
        thumb.style.transition = 'left 0.3s cubic-bezier(0.34,1.56,0.64,1)'
        fill.style.transition = 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1)'
        thumb.style.left = thumbStart + 'px'
        fill.style.transform = 'scaleX(0)'
        setTimeout(() => { thumb.style.transition = ''; fill.style.transition = '' }, 300)
      }
    }

    cta.addEventListener('mousedown', onStart)
    cta.addEventListener('touchstart', onStart, { passive: false })
    window.addEventListener('mousemove', onMove)
    window.addEventListener('touchmove', onMove, { passive: false })
    window.addEventListener('mouseup', onEnd)
    window.addEventListener('touchend', onEnd)

    return () => {
      cta.removeEventListener('mousedown', onStart)
      cta.removeEventListener('touchstart', onStart)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('mouseup', onEnd)
      window.removeEventListener('touchend', onEnd)
    }
  }, [used, onUse])

  return (
    <div ref={ctaRef} className={`slide-cta ${used ? 'used' : ''}`}>
      <div className="slide-cta__track">
        <div ref={fillRef} className="slide-cta__fill" />
      </div>
      <span ref={thumbRef} className="slide-cta__thumb">›</span>
      <span className="slide-cta__label">{used ? '使用済みです' : label}</span>
      <span className="slide-cta__success-label">{successLabel}</span>
    </div>
  )
}
