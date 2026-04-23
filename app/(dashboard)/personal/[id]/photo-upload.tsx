'use client'

import { useRef, useState } from 'react'
import { supabase } from '@/lib/db'

interface Props {
  currentUrl: string | null
  employeeId: string
  initials: string
  onUploaded: (url: string) => void
}

export default function PhotoUpload({ currentUrl, employeeId, initials, onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(currentUrl)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Solo se permiten imágenes (JPG, PNG, WEBP).')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen no puede superar 5 MB.')
      return
    }

    setError('')
    setUploading(true)

    // Preview local inmediato
    const reader = new FileReader()
    reader.onload = e => setPreview(e.target?.result as string)
    reader.readAsDataURL(file)

    try {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
      const path = `employees/${employeeId}/profile.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('employee-photos')
        .upload(path, file, { upsert: true, contentType: file.type })

      if (uploadError) {
        // Si el bucket no existe, guardar como base64 en la tabla directamente
        if (uploadError.message.includes('Bucket not found') || uploadError.message.includes('bucket')) {
          const reader2 = new FileReader()
          reader2.onload = async (e) => {
            const dataUrl = e.target?.result as string
            await supabase.from('employees').update({ photoUrl: dataUrl }).eq('id', employeeId)
            onUploaded(dataUrl)
          }
          reader2.readAsDataURL(file)
          return
        }
        setError(uploadError.message)
        return
      }

      const { data: { publicUrl } } = supabase.storage
        .from('employee-photos')
        .getPublicUrl(path)

      // Guardar URL en la tabla
      await supabase.from('employees').update({ photoUrl: publicUrl }).eq('id', employeeId)
      setPreview(publicUrl)
      onUploaded(publicUrl)
    } catch (err) {
      setError('Error al subir la foto. Intente nuevamente.')
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">Foto de perfil</label>

      {/* Preview */}
      <div className="flex items-center space-x-4">
        <div className="flex-shrink-0">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Foto de perfil"
              className="h-20 w-20 rounded-full object-cover border-2 border-gray-200" />
          ) : (
            <div className="h-20 w-20 rounded-full bg-blue-600 flex items-center justify-center border-2 border-gray-200">
              <span className="text-xl font-bold text-white">{initials}</span>
            </div>
          )}
        </div>

        <div className="flex-1">
          {/* Drop zone */}
          <div
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
          >
            {uploading ? (
              <div className="flex items-center justify-center space-x-2">
                <svg className="h-5 w-5 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span className="text-sm text-blue-600">Subiendo foto...</span>
              </div>
            ) : (
              <>
                <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="mt-1 text-xs text-gray-500">
                  <span className="font-medium text-blue-600">Hacer clic</span> o arrastrar imagen aquí
                </p>
                <p className="text-xs text-gray-400">JPG, PNG, WEBP · máx 5 MB</p>
              </>
            )}
          </div>

          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
          />
        </div>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}
      {preview && !uploading && (
        <button type="button" onClick={() => inputRef.current?.click()}
          className="text-xs text-blue-600 hover:underline">
          Cambiar foto
        </button>
      )}
    </div>
  )
}
