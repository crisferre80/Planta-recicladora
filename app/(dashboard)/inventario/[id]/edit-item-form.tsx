'use client'

import { useState, useRef, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/db'

const CATEGORY_OPTIONS = [
  { value: 'MAQUINARIA',      label: 'Maquinaria' },
  { value: 'MOBILIARIO',      label: 'Mobiliario' },
  { value: 'HERRAMIENTA',     label: 'Herramienta' },
  { value: 'VEHICULO',        label: 'Vehículo' },
  { value: 'ELECTRONICO',     label: 'Electrónico' },
  { value: 'INFRAESTRUCTURA', label: 'Infraestructura' },
  { value: 'OTRO',            label: 'Otro' },
]

const STATUS_OPTIONS = [
  { value: 'OPERATIVO',          label: 'Operativo' },
  { value: 'EN_REPARACION',      label: 'En reparación' },
  { value: 'FUERA_DE_SERVICIO',  label: 'Fuera de servicio' },
  { value: 'BAJA',               label: 'Baja' },
  { value: 'EN_PRESTAMO',        label: 'En préstamo' },
]

interface Props {
  item: {
    id: string
    name: string
    description: string | null
    category: string
    serialNumber: string | null
    brand: string | null
    model: string | null
    location: string | null
    status: string
    purchaseDate: string | null
    purchaseValue: number | null
    usageInstructions: string | null
    notes: string | null
    photoUrl: string | null
  }
}

export default function EditItemForm({ item }: Props) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [photoPreview, setPhotoPreview] = useState<string | null>(item.photoUrl)
  const [photoFile, setPhotoFile] = useState<File | null>(null)

  const [form, setForm] = useState({
    name: item.name,
    description: item.description ?? '',
    category: item.category,
    serialNumber: item.serialNumber ?? '',
    brand: item.brand ?? '',
    model: item.model ?? '',
    location: item.location ?? '',
    status: item.status,
    purchaseDate: item.purchaseDate ?? '',
    purchaseValue: item.purchaseValue?.toString() ?? '',
    usageInstructions: item.usageInstructions ?? '',
    notes: item.notes ?? '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm(p => ({ ...p, [name]: value }))
  }

  const handlePhoto = (file: File) => {
    if (!file.type.startsWith('image/')) { setError('Debe ser una imagen.'); return }
    if (file.size > 5 * 1024 * 1024) { setError('Máximo 5 MB.'); return }
    setPhotoFile(file)
    const reader = new FileReader()
    reader.onload = e => setPhotoPreview(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      let photoUrl = item.photoUrl

      if (photoFile) {
        const ext = photoFile.name.split('.').pop() ?? 'jpg'
        const path = `inventory/${form.serialNumber || item.id}.${ext}`
        const { error: upErr } = await supabase.storage
          .from('inventory-photos')
          .upload(path, photoFile, { upsert: true, contentType: photoFile.type })
        if (!upErr) {
          const { data: urlData } = supabase.storage.from('inventory-photos').getPublicUrl(path)
          photoUrl = urlData.publicUrl
        } else {
          photoUrl = photoPreview
        }
      }

      const { error: updateErr } = await supabase.from('inventory_items').update({
        name: form.name.trim(),
        description: form.description.trim() || null,
        category: form.category,
        serialNumber: form.serialNumber.trim() || null,
        brand: form.brand.trim() || null,
        model: form.model.trim() || null,
        location: form.location.trim() || null,
        status: form.status,
        purchaseDate: form.purchaseDate || null,
        purchaseValue: form.purchaseValue ? parseFloat(form.purchaseValue) : null,
        usageInstructions: form.usageInstructions.trim() || null,
        notes: form.notes.trim() || null,
        photoUrl,
        updatedAt: new Date().toISOString(),
      }).eq('id', item.id)

      if (updateErr) { setError(updateErr.message); return }
      setOpen(false)
      router.refresh()
    } catch {
      setError('Error al guardar.')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = 'mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm text-gray-900'

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="inline-flex items-center text-sm text-blue-600 hover:underline">
        <svg className="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        Editar ítem
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
      <div className="p-4 flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-800">Editar ítem</p>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>

      {/* Foto */}
      <div className="p-4 space-y-2">
        <label className="text-xs font-medium text-gray-700">Foto</label>
        <div className="flex gap-3 items-center">
          <div className="flex-shrink-0 h-20 w-20 rounded-lg border border-gray-200 bg-gray-50 overflow-hidden flex items-center justify-center">
            {photoPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoPreview} alt="Preview" className="h-full w-full object-cover" />
            ) : (
              <span className="text-2xl opacity-30">📷</span>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <button type="button" onClick={() => cameraInputRef.current?.click()}
              className="text-xs border border-gray-300 px-2 py-1.5 rounded text-gray-600 hover:bg-gray-50">📷 Cámara</button>
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment"
              onChange={e => { const f = e.target.files?.[0]; if (f) handlePhoto(f) }} className="hidden" />
            <button type="button" onClick={() => fileInputRef.current?.click()}
              className="text-xs border border-gray-300 px-2 py-1.5 rounded text-gray-600 hover:bg-gray-50">🖼 Archivo</button>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp"
              onChange={e => { const f = e.target.files?.[0]; if (f) handlePhoto(f) }} className="hidden" />
          </div>
        </div>
      </div>

      <div className="p-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="text-xs font-medium text-gray-700">Nombre *</label>
          <input type="text" name="name" required value={form.name} onChange={handleChange} className={inputClass} />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs font-medium text-gray-700">Descripción</label>
          <textarea name="description" rows={3} value={form.description} onChange={handleChange} className={inputClass} />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-700">Categoría</label>
          <select name="category" value={form.category} onChange={handleChange} className={inputClass}>
            {CATEGORY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-700">Estado</label>
          <select name="status" value={form.status} onChange={handleChange} className={inputClass}>
            {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-700">Marca</label>
          <input type="text" name="brand" value={form.brand} onChange={handleChange} className={inputClass} />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-700">Modelo</label>
          <input type="text" name="model" value={form.model} onChange={handleChange} className={inputClass} />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-700">Ubicación</label>
          <input type="text" name="location" value={form.location} onChange={handleChange} className={inputClass} />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-700">N° de serie</label>
          <input type="text" name="serialNumber" value={form.serialNumber} onChange={handleChange} className={`${inputClass} font-mono`} />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs font-medium text-gray-700">Instrucciones de uso</label>
          <textarea name="usageInstructions" rows={3} value={form.usageInstructions} onChange={handleChange} className={inputClass} />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-700">Fecha de compra</label>
          <input type="date" name="purchaseDate" value={form.purchaseDate} onChange={handleChange} className={inputClass} />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-700">Valor de compra ($)</label>
          <input type="number" name="purchaseValue" min="0" step="0.01" value={form.purchaseValue} onChange={handleChange} className={inputClass} />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs font-medium text-gray-700">Notas</label>
          <textarea name="notes" rows={2} value={form.notes} onChange={handleChange} className={inputClass} />
        </div>
      </div>

      <div className="p-4 flex gap-2">
        <button type="submit" disabled={loading}
          className="text-sm bg-green-600 text-white px-4 py-1.5 rounded hover:bg-green-700 disabled:opacity-50">
          {loading ? 'Guardando...' : 'Guardar cambios'}
        </button>
        <button type="button" onClick={() => setOpen(false)}
          className="text-sm border border-gray-300 px-4 py-1.5 rounded text-gray-600 hover:bg-gray-50">
          Cancelar
        </button>
      </div>
    </form>
  )
}
