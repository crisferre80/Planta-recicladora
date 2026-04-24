'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

export default function EscanearInventarioPage() {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [error, setError] = useState('')
  const [scanning, setScanning] = useState(false)
  const [manualCode, setManualCode] = useState('')
  const [permissionDenied, setPermissionDenied] = useState(false)

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    setScanning(false)
  }, [])

  const startCamera = useCallback(async () => {
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        setScanning(true)
      }
    } catch {
      setPermissionDenied(true)
      setError('No se pudo acceder a la cámara. Verificá los permisos del navegador.')
    }
  }, [])

  // Escaneo continuo con jsQR (cargado dinámicamente)
  useEffect(() => {
    if (!scanning) return
    let animId: number
    let jsQR: any

    import('jsqr').then(m => { jsQR = m.default; tick() }).catch(() => {})

    function tick() {
      const video = videoRef.current
      const canvas = canvasRef.current
      if (!video || !canvas || !jsQR) { animId = requestAnimationFrame(tick); return }
      if (video.readyState !== video.HAVE_ENOUGH_DATA) { animId = requestAnimationFrame(tick); return }

      canvas.width  = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(video, 0, 0)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const code = jsQR(imageData.data, canvas.width, canvas.height, { inversionAttempts: 'dontInvert' })

      if (code?.data) {
        stopCamera()
        handleQRResult(code.data)
        return
      }
      animId = requestAnimationFrame(tick)
    }

    return () => cancelAnimationFrame(animId)
  }, [scanning, stopCamera])

  useEffect(() => () => { stopCamera() }, [stopCamera])

  const handleQRResult = (data: string) => {
    try {
      // El QR puede contener la URL completa o solo el ID / número de serie
      const url = new URL(data)
      // Extraer el path: /inventario/{id}
      const match = url.pathname.match(/\/inventario\/([^/]+)/)
      if (match) {
        router.push(`/inventario/${match[1]}`)
        return
      }
    } catch {}
    // Si no es URL válida, intentar buscar como serial
    router.push(`/inventario/buscar?q=${encodeURIComponent(data)}`)
  }

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualCode.trim()) return
    handleQRResult(manualCode.trim())
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <button onClick={() => router.back()} className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700">
          <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver
        </button>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">Escanear QR de Inventario</h1>
        <p className="mt-1 text-sm text-gray-500">Apuntá la cámara al código QR de la etiqueta del objeto.</p>
      </div>

      {/* Cámara */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="relative bg-black aspect-video flex items-center justify-center">
          <video ref={videoRef} playsInline muted className={`w-full h-full object-cover ${scanning ? 'block' : 'hidden'}`} />
          <canvas ref={canvasRef} className="hidden" />

          {!scanning && !permissionDenied && (
            <div className="text-center text-white p-8 space-y-4">
              <svg className="mx-auto h-16 w-16 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              <button onClick={startCamera}
                className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
                <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Activar cámara
              </button>
            </div>
          )}

          {scanning && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-56 h-56 border-2 border-green-400 rounded-lg shadow-lg opacity-80">
                <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-green-400 rounded-tl" />
                <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-green-400 rounded-tr" />
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-green-400 rounded-bl" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-green-400 rounded-br" />
              </div>
            </div>
          )}
        </div>

        {scanning && (
          <div className="p-4 flex justify-center">
            <button onClick={stopCamera}
              className="text-sm text-red-600 border border-red-300 px-4 py-1.5 rounded hover:bg-red-50">
              Detener cámara
            </button>
          </div>
        )}

        {(error || permissionDenied) && (
          <div className="p-4 bg-red-50 border-t border-red-100">
            <p className="text-sm text-red-700">{error || 'Permiso de cámara denegado.'}</p>
          </div>
        )}
      </div>

      {/* Búsqueda manual por número de serie */}
      <div className="bg-white shadow rounded-lg p-5 space-y-3">
        <h2 className="text-sm font-semibold text-gray-800">Búsqueda manual por N° de serie</h2>
        <form onSubmit={handleManualSearch} className="flex gap-2">
          <input
            type="text"
            value={manualCode}
            onChange={e => setManualCode(e.target.value)}
            placeholder="Ej: INV-M5ABC-XY12"
            className="flex-1 border border-gray-300 rounded-md py-2 px-3 text-sm font-mono text-gray-900 focus:ring-green-500 focus:border-green-500"
          />
          <button type="submit"
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700">
            Buscar
          </button>
        </form>
      </div>
    </div>
  )
}
