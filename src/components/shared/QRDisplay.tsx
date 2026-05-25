import { useEffect, useState } from 'react'
import { generateQRDataURL } from '@/lib/qr'
import type { QRPayload } from '@/types'

interface QRDisplayProps {
  payload: QRPayload
  label?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizeMap = { sm: 150, md: 220, lg: 300 }

export function QRDisplay({ payload, label, size = 'md' }: QRDisplayProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null)

  useEffect(() => {
    generateQRDataURL(payload).then(setDataUrl)
  }, [payload])

  if (!dataUrl) {
    return (
      <div
        className="animate-pulse rounded-xl bg-muted"
        style={{ width: sizeMap[size], height: sizeMap[size] }}
      />
    )
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <img
        src={dataUrl}
        alt="QRコード"
        width={sizeMap[size]}
        height={sizeMap[size]}
        className="rounded-xl"
      />
      {label && (
        <p className="text-xs text-muted-foreground">{label}</p>
      )}
    </div>
  )
}
