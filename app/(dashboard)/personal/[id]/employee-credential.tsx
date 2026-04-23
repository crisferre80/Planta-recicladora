'use client'

import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'

interface Props {
  employeeId: string
  firstName: string
  lastName: string
  position: string
  department: string
  photoUrl: string | null
}

/**
 * Genera un token cifrado simple usando Web Crypto API (HMAC-SHA256).
 * El payload contiene: id del empleado + timestamp de emisión.
 * La verificación ocurre en la página de escaneo (/personal/escanear).
 */
async function generateCredentialToken(employeeId: string): Promise<string> {
  const payload = {
    id: employeeId,
    iat: Math.floor(Date.now() / 1000),
    type: 'employee-attendance',
  }
  const payloadB64 = btoa(JSON.stringify(payload))

  // Firma con la clave pública embebida (suficiente para identificación interna)
  const secret = process.env.NEXT_PUBLIC_QR_SECRET ?? 'planta-recicladora-qr-secret'
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payloadB64))
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')

  return `${payloadB64}.${sigB64}`
}

export default function EmployeeCredential({ employeeId, firstName, lastName, position, department, photoUrl }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const printRef = useRef<HTMLDivElement>(null)
  const [token, setToken] = useState<string>('')
  const [qrDataUrl, setQrDataUrl] = useState<string>('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    generateCredentialToken(employeeId).then(async (tok) => {
      setToken(tok)
      // URL que se codifica en el QR — apunta a la página de registro de asistencia
      const qrUrl = `${window.location.origin}/personal/escanear?token=${encodeURIComponent(tok)}`
      const dataUrl = await QRCode.toDataURL(qrUrl, {
        width: 200,
        margin: 2,
        color: { dark: '#1e3a5f', light: '#ffffff' },
        errorCorrectionLevel: 'H',
      })
      setQrDataUrl(dataUrl)
      // También renderizar en canvas para impresión
      if (canvasRef.current) {
        await QRCode.toCanvas(canvasRef.current, qrUrl, {
          width: 200,
          margin: 2,
          color: { dark: '#1e3a5f', light: '#ffffff' },
          errorCorrectionLevel: 'H',
        })
      }
    })
  }, [employeeId])

  const handlePrint = () => {
    const content = printRef.current
    if (!content) return
    const win = window.open('', '_blank', 'width=400,height=600')
    if (!win) return
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Credencial - ${firstName} ${lastName}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f3f4f6; }
          .card { background: white; border-radius: 12px; padding: 24px; max-width: 320px; margin: auto;
                  box-shadow: 0 4px 12px rgba(0,0,0,0.15); border: 2px solid #1e3a5f; }
          .header { background: linear-gradient(135deg,#1e3a5f,#2563eb); color:white; padding:16px;
                    border-radius:8px; text-align:center; margin-bottom:16px; }
          .header h2 { margin:0; font-size:14px; letter-spacing:2px; opacity:.8; }
          .header h1 { margin:4px 0 0; font-size:18px; font-weight:bold; }
          .photo { width:80px; height:80px; border-radius:50%; border:3px solid white;
                   display:block; margin:-40px auto 12px; object-fit:cover; background:#ddd; }
          .initials { width:80px; height:80px; border-radius:50%; border:3px solid white;
                      display:flex; align-items:center; justify-content:center;
                      background:#1e3a5f; color:white; font-size:24px; font-weight:bold;
                      margin:-40px auto 12px; }
          .name { text-align:center; font-size:16px; font-weight:bold; color:#1e3a5f; }
          .role { text-align:center; font-size:12px; color:#6b7280; margin-top:2px; }
          .qr { text-align:center; margin:16px 0; }
          .qr img { border:1px solid #e5e7eb; border-radius:4px; }
          .id-chip { background:#f3f4f6; border-radius:6px; padding:6px 10px; font-size:9px;
                     color:#6b7280; text-align:center; word-break:break-all; font-family:monospace; }
          .footer { text-align:center; font-size:9px; color:#9ca3af; margin-top:12px; }
        </style>
      </head>
      <body>${content.innerHTML}</body>
      </html>
    `)
    win.document.close()
    win.focus()
    setTimeout(() => { win.print(); win.close() }, 500)
  }

  const handleCopyToken = async () => {
    await navigator.clipboard.writeText(token)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const initials = `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase()

  return (
    <div className="space-y-3">
      {/* Credencial visual */}
      <div ref={printRef}>
        <div className="card bg-white rounded-xl shadow-md border-2 border-blue-900 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-br from-blue-900 to-blue-600 px-4 pt-4 pb-10 text-white text-center">
            <p className="text-xs tracking-widest opacity-80 uppercase">Planta Recicladora</p>
            <p className="text-sm font-bold mt-0.5">Credencial de Empleado</p>
          </div>

          {/* Avatar */}
          <div className="flex justify-center -mt-8 mb-2">
            {photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoUrl} alt={`${firstName} ${lastName}`}
                className="h-16 w-16 rounded-full ring-4 ring-white object-cover" />
            ) : (
              <div className="h-16 w-16 rounded-full ring-4 ring-white bg-blue-700 flex items-center justify-center">
                <span className="text-xl font-bold text-white">{initials}</span>
              </div>
            )}
          </div>

          <div className="px-4 pb-4 text-center space-y-1">
            <p className="font-bold text-gray-900 text-base">{firstName} {lastName}</p>
            <p className="text-xs text-gray-500">{position}</p>
            <p className="text-xs text-gray-400 uppercase tracking-wide">{department}</p>

            {/* QR Code */}
            <div className="flex justify-center py-3">
              {qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qrDataUrl} alt="QR Credencial" className="rounded border border-gray-200" width={160} height={160} />
              ) : (
                <div className="h-40 w-40 bg-gray-100 rounded flex items-center justify-center">
                  <svg className="h-8 w-8 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                </div>
              )}
            </div>

            {/* ID chip */}
            <div className="bg-gray-50 rounded-md px-2 py-1.5 text-center">
              <p className="text-xs text-gray-400 mb-0.5">ID único</p>
              <p className="font-mono text-xs text-gray-600 break-all">{employeeId.slice(0, 16)}…</p>
            </div>
          </div>
        </div>
      </div>

      {/* Canvas oculto (para impresión de alta resolución) */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Acciones */}
      <button
        onClick={handlePrint}
        className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
      >
        <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
        </svg>
        Imprimir Credencial
      </button>

      <button
        onClick={handleCopyToken}
        className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
      >
        {copied ? (
          <>
            <svg className="mr-2 h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            ¡Copiado!
          </>
        ) : (
          <>
            <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Copiar token QR
          </>
        )}
      </button>
    </div>
  )
}
