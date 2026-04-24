'use client'

import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'

interface Props {
  itemId: string
  serialNumber: string
  name: string
}

export default function ItemQR({ itemId, serialNumber, name }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [qrDataUrl, setQrDataUrl] = useState<string>('')

  const qrValue = `${typeof window !== 'undefined' ? window.location.origin : ''}/inventario/${itemId}`

  useEffect(() => {
    const url = `${window.location.origin}/inventario/${itemId}`
    QRCode.toDataURL(url, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 200,
      color: { dark: '#000000', light: '#ffffff' },
    }).then(setQrDataUrl)
  }, [itemId])

  const handlePrint = () => {
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>QR Inventario — ${name}</title>
        <style>
          body { margin: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: white; font-family: Arial, sans-serif; }
          .card { border: 2px solid #000; border-radius: 8px; padding: 16px; text-align: center; width: 200px; }
          .card img { width: 180px; height: 180px; display: block; margin: 0 auto; }
          .card h2 { font-size: 11px; font-weight: bold; margin: 6px 0 2px; word-break: break-word; }
          .card p  { font-size: 9px; color: #555; margin: 0; font-family: monospace; }
          .card .badge { margin-top: 6px; font-size: 9px; background: #d1fae5; color: #065f46; padding: 2px 6px; border-radius: 10px; display: inline-block; }
          @media print { body { -webkit-print-color-adjust: exact; } }
        </style>
      </head>
      <body>
        <div class="card">
          <img src="${qrDataUrl}" alt="QR" />
          <h2>${name}</h2>
          <p>${serialNumber}</p>
          <span class="badge">Planta Recicladora</span>
        </div>
        <script>window.onload = () => { window.print(); window.close(); }<\/script>
      </body>
      </html>
    `)
    win.document.close()
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 space-y-3">
      <h2 className="text-sm font-semibold text-gray-800">Código QR</h2>

      <div className="flex justify-center">
        {qrDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={qrDataUrl} alt="QR del ítem" className="w-40 h-40 border border-gray-100 rounded" />
        ) : (
          <div className="w-40 h-40 bg-gray-100 rounded animate-pulse" />
        )}
      </div>

      <div className="text-center">
        <p className="text-xs font-mono text-gray-600 break-all">{serialNumber}</p>
        <p className="text-xs text-gray-400 mt-1">Escaneá para ver el detalle</p>
      </div>

      <button
        onClick={handlePrint}
        disabled={!qrDataUrl}
        className="w-full inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-40"
      >
        <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
        </svg>
        Imprimir etiqueta QR
      </button>
    </div>
  )
}
