'use client'

import { useState, useRef, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/db'

const CATEGORY_OPTIONS = [
  { value: 'MAQUINARIA',      label: 'Maquinaria' },
  { value: 'MOBILIARIO',      label: 'Mobiliario' },
  { value: 'HERRAMIENTA',     label: 'Herramienta' },
  { value: 'VEHICULO',        label: 'Vehículo' },
  { value: 'ELECTRONICO',     label: 'Electrónico / Informático' },
  { value: 'INFRAESTRUCTURA', label: 'Infraestructura' },
  { value: 'OTRO',            label: 'Otro' },
]

const STATUS_OPTIONS = [
  { value: 'OPERATIVO',          label: 'Operativo' },
  { value: 'EN_REPARACION',      label: 'En reparación' },
  { value: 'FUERA_DE_SERVICIO',  label: 'Fuera de servicio' },
  { value: 'EN_PRESTAMO',        label: 'En préstamo' },
]

function generateSerial(): string {
  const ts = Date.now().toString(36).toUpperCase()
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `INV-${ts}-${rand}`
}

export default function NuevoInventarioPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)

  const [form, setForm] = useState({
    name: '',
    description: '',
    category: 'MAQUINARIA',
    serialNumber: generateSerial(),
    brand: '',
    model: '',
    location: '',
    status: 'OPERATIVO',
    purchaseDate: '',
    purchaseValue: '',
    usageInstructions: '',
    notes: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handlePhoto = (file: File) => {
    if (!file.type.startsWith('image/')) { setError('El archivo debe ser una imagen.'); return }
    if (file.size > 5 * 1024 * 1024) { setError('La imagen no puede superar 5 MB.'); return }
    setPhotoFile(file)
    const reader = new FileReader()
    reader.onload = e => setPhotoPreview(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handlePhoto(file)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.name.trim()) { setError('El nombre es obligatorio.'); return }

    setIsLoading(true)
    try {
      let photoUrl: string | null = null

      // Subir foto si hay una
      if (photoFile) {
        const ext = photoFile.name.split('.').pop() ?? 'jpg'
        const path = `inventory/${form.serialNumber}.${ext}`
        const { error: uploadErr } = await supabase.storage
          .from('inventory-photos')
          .upload(path, photoFile, { upsert: true, contentType: photoFile.type })

        if (!uploadErr) {
          const { data: urlData } = supabase.storage.from('inventory-photos').getPublicUrl(path)
          photoUrl = urlData.publicUrl
        } else {
          // fallback base64
          photoUrl = photoPreview
        }
      }

      const { data, error: insertErr } = await supabase.from('inventory_items').insert([{
        name: form.name.trim(),
        description: form.description.trim() || null,
        category: form.category,
        serialNumber: form.serialNumber.trim(),
        brand: form.brand.trim() || null,
        model: form.model.trim() || null,
        location: form.location.trim() || null,
        status: form.status,
        purchaseDate: form.purchaseDate || null,
        purchaseValue: form.purchaseValue ? parseFloat(form.purchaseValue) : null,
        usageInstructions: form.usageInstructions.trim() || null,
        notes: form.notes.trim() || null,
        photoUrl,
      }]).select().single()

      if (insertErr) { setError(insertErr.message); return }
      router.push(`/inventario/${data.id}`)
    } catch {
      setError('Error al registrar el ítem. Intente nuevamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const inputClass = 'mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm text-gray-900'

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link href="/inventario" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700">
          <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver al inventario
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">Registrar Nuevo Ítem</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white shadow sm:rounded-lg divide-y divide-gray-100">
        {error && (
          <div className="p-4 bg-red-50">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Foto */}
        <div className="p-6 space-y-3">
          <h2 className="text-sm font-semibold text-gray-800">Foto del ítem</h2>
          <div className="flex gap-3 items-start">
            {/* Preview */}
            <div className="flex-shrink-0 h-32 w-32 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 overflow-hidden flex items-center justify-center">
              {photoPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoPreview} alt="Preview" className="h-full w-full object-cover" />
              ) : (
                <span className="text-4xl opacity-40">📷</span>
              )}
            </div>
            <div className="flex flex-col gap-2">
              {/* Cámara (móvil) */}
              <button type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                <svg className="mr-2 h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Usar cámara
              </button>
              <input ref={cameraInputRef} type="file" accept="image/*" capture="environment"
                onChange={handleFileChange} className="hidden" />
              {/* Archivo */}
              <button type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                <svg className="mr-2 h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Elegir archivo
              </button>
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange} className="hidden" />
              {photoPreview && (
                <button type="button" onClick={() => { setPhotoPreview(null); setPhotoFile(null) }}
                  className="text-xs text-red-500 hover:underline">Quitar foto</button>
              )}
            </div>
          </div>
        </div>

        {/* Datos básicos */}
        <div className="p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-800">Datos básicos</h2>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nombre *</label>
            <input type="text" name="name" id="name" required placeholder="Ej: Prensa hidráulica 10T"
              value={form.name} onChange={handleChange} className={inputClass} />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Descripción</label>
            <textarea name="description" id="description" rows={3}
              placeholder="Descripción detallada, características, capacidad..."
              value={form.description} onChange={handleChange}
              className={inputClass} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">Categoría *</label>
              <select name="category" id="category" required value={form.category} onChange={handleChange} className={inputClass}>
                {CATEGORY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">Estado inicial *</label>
              <select name="status" id="status" required value={form.status} onChange={handleChange} className={inputClass}>
                {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="brand" className="block text-sm font-medium text-gray-700">Marca</label>
              <input type="text" name="brand" id="brand" placeholder="Ej: Caterpillar"
                value={form.brand} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label htmlFor="model" className="block text-sm font-medium text-gray-700">Modelo</label>
              <input type="text" name="model" id="model" placeholder="Ej: HP-2000"
                value={form.model} onChange={handleChange} className={inputClass} />
            </div>
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700">Ubicación en planta</label>
            <input type="text" name="location" id="location" placeholder="Ej: Galpón 2 - Sector Prensas"
              value={form.location} onChange={handleChange} className={inputClass} />
          </div>
        </div>

        {/* Número de serie */}
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-800">Número de serie / QR</h2>
            <button type="button" onClick={() => setForm(p => ({ ...p, serialNumber: generateSerial() }))}
              className="text-xs text-blue-600 hover:underline">Regenerar</button>
          </div>
          <div>
            <label htmlFor="serialNumber" className="block text-sm font-medium text-gray-700">Número de serie único *</label>
            <input type="text" name="serialNumber" id="serialNumber" required
              value={form.serialNumber} onChange={handleChange}
              className={`${inputClass} font-mono`} />
            <p className="mt-1 text-xs text-gray-400">Se generará un QR imprimible con este código para pegar en el objeto.</p>
          </div>
        </div>

        {/* Modo de uso */}
        <div className="p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-800">Modo de uso</h2>
          <div>
            <label htmlFor="usageInstructions" className="block text-sm font-medium text-gray-700">Instrucciones de uso</label>
            <textarea name="usageInstructions" id="usageInstructions" rows={4}
              placeholder="Pasos de operación, precauciones, EPP requerido, capacidad máxima..."
              value={form.usageInstructions} onChange={handleChange}
              className={inputClass} />
          </div>
        </div>

        {/* Datos de compra */}
        <div className="p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-800">Información de compra (opcional)</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="purchaseDate" className="block text-sm font-medium text-gray-700">Fecha de compra</label>
              <input type="date" name="purchaseDate" id="purchaseDate"
                value={form.purchaseDate} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label htmlFor="purchaseValue" className="block text-sm font-medium text-gray-700">Valor de compra ($)</label>
              <input type="number" name="purchaseValue" id="purchaseValue" min="0" step="0.01" placeholder="0.00"
                value={form.purchaseValue} onChange={handleChange} className={inputClass} />
            </div>
          </div>
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notas adicionales</label>
            <textarea name="notes" id="notes" rows={2}
              placeholder="Garantía, proveedor, observaciones..."
              value={form.notes} onChange={handleChange}
              className={inputClass} />
          </div>
        </div>

        {/* Botones */}
        <div className="p-6 flex justify-end gap-3">
          <Link href="/inventario"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            Cancelar
          </Link>
          <button type="submit" disabled={isLoading}
            className="inline-flex items-center px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50">
            {isLoading ? 'Guardando...' : 'Registrar ítem'}
          </button>
        </div>
      </form>
    </div>
  )
}
