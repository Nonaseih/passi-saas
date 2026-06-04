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

    // Non-null asserted inside the effect after guard
    const ctaEl = cta
    const thumbEl = thumb
    const fillEl = fill

    const THRESHOLD = 0.72
    let dragging = false
    let startX = 0
    let thumbStart = 0
    let maxSlide = 0

    function getClientX(e: MouseEvent | TouchEvent) {
      return 'touches' in e ? e.touches[0].clientX : e.clientX
    }

    function onStart(e: MouseEvent | TouchEvent) {
      const thumbRect = thumbEl.getBoundingClientRect()
      const cx = getClientX(e)
      if (Math.abs(cx - thumbRect.left - thumbRect.width / 2) > thumbRect.width) return
      dragging = true
      startX = cx
      thumbStart = parseFloat(getComputedStyle(thumbEl).left) || 5
      maxSlide = ctaEl.getBoundingClientRect().width - thumbRect.width - 10
      ctaEl.classList.add('swiping')
      e.preventDefault()
    }

    function onMove(e: MouseEvent | TouchEvent) {
      if (!dragging) return
      e.preventDefault()
      const cx = getClientX(e)
      const newLeft = Math.max(thumbStart, Math.min(thumbStart + (cx - startX), thumbStart + maxSlide))
      thumbEl.style.left = newLeft + 'px'
      fillEl.style.transform = `scaleX(${(newLeft - thumbStart) / maxSlide})`
    }

    function onEnd() {
      if (!dragging) return
      dragging = false
      ctaEl.classList.remove('swiping')
      const progress = (parseFloat(thumbEl.style.left || String(thumbStart)) - thumbStart) / maxSlide

      if (progress >= THRESHOLD) {
        thumbEl.style.transition = 'left 0.22s cubic-bezier(0.22,1,0.36,1)'
        fillEl.style.transition = 'transform 0.22s cubic-bezier(0.22,1,0.36,1)'
        thumbEl.style.left = (thumbStart + maxSlide) + 'px'
        fillEl.style.transform = 'scaleX(1)'
        setTimeout(() => {
          thumbEl.style.transition = ''
          fillEl.style.transition = ''
          onUse()
        }, 220)
      } else {
        thumbEl.style.transition = 'left 0.3s cubic-bezier(0.34,1.56,0.64,1)'
        fillEl.style.transition = 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1)'
        thumbEl.style.left = thumbStart + 'px'
        fillEl.style.transform = 'scaleX(0)'
        setTimeout(() => { thumbEl.style.transition = ''; fillEl.style.transition = '' }, 300)
      }
    }

    ctaEl.addEventListener('mousedown', onStart)
    ctaEl.addEventListener('touchstart', onStart, { passive: false })
    window.addEventListener('mousemove', onMove)
    window.addEventListener('touchmove', onMove, { passive: false })
    window.addEventListener('mouseup', onEnd)
    window.addEventListener('touchend', onEnd)

    return () => {
      ctaEl.removeEventListener('mousedown', onStart)
      ctaEl.removeEventListener('touchstart', onStart)
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
