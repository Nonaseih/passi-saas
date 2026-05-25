import QRCode from 'qrcode'
import type { QRPayload } from '@/types'

/**
 * Generate a QR code data URL from a ticket payload.
 * The payload is JSON-encoded so the scanner can extract ticket_id + qr_token.
 */
export async function generateQRDataURL(payload: QRPayload): Promise<string> {
  const data = JSON.stringify(payload)
  return QRCode.toDataURL(data, {
    width: 300,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
    errorCorrectionLevel: 'H',
  })
}

/**
 * Parse and validate a scanned QR string.
 * Returns null if the QR data is invalid.
 */
export function parseQRPayload(raw: string): QRPayload | null {
  try {
    const parsed = JSON.parse(raw) as QRPayload
    if (!parsed.ticket_id || !parsed.qr_token || !parsed.event_id) return null
    return parsed
  } catch {
    return null
  }
}
