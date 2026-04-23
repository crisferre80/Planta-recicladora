'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/db'
import Link from 'next/link'

type Status = 'idle' | 'loading' | 'success' | 'error' | 'invalid'

async function verifyToken(token: string): Promise<{ valid: boolean; employeeId?: string }> {
  const parts = token.split('.')
  if (parts.length !== 2) return { valid: false }

  const [payloadB64, sigB64] = parts
  try {
    const payload = JSON.parse(atob(payloadB64))
    if (payload.type !== 'employee-attendance' || !payload.id) return { valid: false }

    // Re-firmar y comparar
    const secret = process.env.NEXT_PUBLIC_QR_SECRET ?? 'planta-recicladora-qr-secret'
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    const expectedSig = await crypto.subtle.sign('HMAC', key, encoder.encode(payloadB64))
    const expectedB64 = btoa(String.fromCharCode(...new Uint8Array(expectedSig)))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')

    if (expectedB64 !== sigB64) return { valid: false }
    return { valid: true, employeeId: payload.id }
  } catch {
    return { valid: false }
  }
}

function ScannerContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState('')
  const [employeeName, setEmployeeName] = useState('')
  const [attendanceType, setAttendanceType] = useState<'ENTRADA' | 'SALIDA'>('ENTRADA')
  const [cameraActive, setCameraActive] = useState(false)
  const streamRef = useRef<MediaStream | null>(null)

  // Si viene token por URL (desde el QR escaneado por celular), procesar automáticamente
  useEffect(() => {
    const token = searchParams.get('token')
    if (token) {
      handleTokenRegister(token)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleTokenRegister = async (token: string) => {
    setStatus('loading')
    setMessage('Verificando credencial...')

    const { valid, employeeId } = await verifyToken(token)
    if (!valid || !employeeId) {
      setStatus('invalid')
      setMessage('Credencial inválida o manipulada.')
      return
    }

    // Obtener nombre del empleado
    const { data: emp } = await supabase
      .from('employees')
      .select('firstName, lastName, status')
      .eq('id', employeeId)
      .single()

    if (!emp) {
      setStatus('error')
      setMessage('Empleado no encontrado en el sistema.')
      return
    }

    if (emp.status !== 'ACTIVO') {
      setStatus('error')
      setMessage(`El empleado ${emp.firstName} ${emp.lastName} no está activo.`)
      return
    }

    setEmployeeName(`${emp.firstName} ${emp.lastName}`)
    const today = new Date().toISOString().slice(0, 10)
    const now = new Date().toTimeString().slice(0, 5)

    // Verificar si ya tiene registro hoy
    const { data: existing } = await supabase
      .from('attendance_records')
      .select('id, checkIn, checkOut')
      .eq('employeeId', employeeId)
      .eq('date', today)
      .single()

    if (existing) {
      if (!existing.checkOut) {
        // Registrar salida
        const { error } = await supabase
          .from('attendance_records')
          .update({ checkOut: now, status: 'PRESENTE' })
          .eq('id', existing.id)
        if (error) { setStatus('error'); setMessage(error.message); return }
        setAttendanceType('SALIDA')
      } else {
        setStatus('success')
        setMessage(`${emp.firstName} ${emp.lastName} ya registró entrada y salida hoy.`)
        return
      }
    } else {
      // Registrar entrada
      const { error } = await supabase
        .from('attendance_records')
        .insert({
          employeeId,
          date: today,
          checkIn: now,
          status: 'PRESENTE',
          notes: 'Registrado por QR',
        })
      if (error) { setStatus('error'); setMessage(error.message); return }
      setAttendanceType('ENTRADA')
    }

    setStatus('success')
  }

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
      setCameraActive(true)
    } catch {
      setStatus('error')
      setMessage('No se pudo acceder a la cámara. Use el campo manual.')
    }
  }

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setCameraActive(false)
  }

  useEffect(() => () => { stopCamera() }, [])

  const [manualToken, setManualToken] = useState('')
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (manualToken.trim()) handleTokenRegister(manualToken.trim())
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <Link href="/personal" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700">
          <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver a Personal
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">Registro de Asistencia por QR</h1>
        <p className="text-sm text-gray-500">Escanee la credencial QR del empleado o ingrese el token manualmente.</p>
      </div>

      {/* Resultado */}
      {status === 'success' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <svg className="mx-auto h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="mt-2 text-lg font-semibold text-green-800">{attendanceType === 'ENTRADA' ? '✅ Entrada registrada' : '👋 Salida registrada'}</h2>
          <p className="text-green-700 mt-1">{employeeName || message}</p>
          <p className="text-green-600 text-sm mt-1">{new Date().toLocaleTimeString('es-AR')}</p>
          <button
            onClick={() => { setStatus('idle'); setManualToken(''); router.replace('/personal/escanear') }}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700"
          >
            Registrar otro
          </button>
        </div>
      )}

      {(status === 'error' || status === 'invalid') && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <svg className="mx-auto h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          <p className="mt-2 text-sm font-medium text-red-800">{message}</p>
          <button onClick={() => { setStatus('idle'); setManualToken('') }}
            className="mt-3 px-4 py-1.5 bg-red-600 text-white rounded text-sm hover:bg-red-700">
            Intentar de nuevo
          </button>
        </div>
      )}

      {status === 'loading' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <svg className="mx-auto h-8 w-8 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <p className="mt-2 text-sm text-blue-700">{message}</p>
        </div>
      )}

      {status === 'idle' && (
        <>
          {/* Cámara */}
          <div className="bg-white shadow rounded-lg p-4">
            <h2 className="text-sm font-medium text-gray-900 mb-3">Usar cámara del dispositivo</h2>
            {!cameraActive ? (
              <button onClick={startCamera}
                className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors">
                <svg className="mx-auto h-8 w-8 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Activar cámara para escanear QR
              </button>
            ) : (
              <div className="space-y-2">
                <video ref={videoRef} autoPlay playsInline className="w-full rounded-lg bg-black" />
                <p className="text-xs text-center text-gray-500">Apunte la cámara al código QR de la credencial</p>
                <button onClick={stopCamera} className="w-full text-sm text-gray-500 hover:text-red-500">
                  Detener cámara
                </button>
              </div>
            )}
          </div>

          {/* Token manual */}
          <div className="bg-white shadow rounded-lg p-4">
            <h2 className="text-sm font-medium text-gray-900 mb-3">Ingresar token manualmente</h2>
            <form onSubmit={handleManualSubmit} className="space-y-3">
              <textarea
                value={manualToken}
                onChange={e => setManualToken(e.target.value)}
                placeholder="Pegue aquí el token de la credencial QR..."
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button type="submit" disabled={!manualToken.trim()}
                className="w-full py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
                Registrar asistencia
              </button>
            </form>
          </div>

          <p className="text-center text-xs text-gray-400">
            💡 Tip: En dispositivos móviles, simplemente escanee el QR con la app de cámara para abrir esta página automáticamente.
          </p>
        </>
      )}
    </div>
  )
}

export default function EscanearPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-gray-500">Cargando...</div>}>
      <ScannerContent />
    </Suspense>
  )
}
