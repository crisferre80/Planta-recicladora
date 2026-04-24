'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/db'

const TYPE_OPTIONS = [
  { value: 'INSPECCION',   label: 'Inspección' },
  { value: 'MANTENIMIENTO',label: 'Mantenimiento preventivo' },
  { value: 'REPARACION',   label: 'Reparación' },
  { value: 'LIMPIEZA',     label: 'Limpieza' },
  { value: 'CALIBRACION',  label: 'Calibración' },
  { value: 'BAJA',         label: 'Registro de baja / descarte' },
]

const STATUS_OPTIONS = [
  { value: 'COMPLETADO', label: 'Completado' },
  { value: 'EN_CURSO',   label: 'En curso' },
  { value: 'PENDIENTE',  label: 'Pendiente' },
]

interface Props {
  itemId: string
  currentStatus: string
  onAdded: () => void
}

export default function MaintenanceForm({ itemId, currentStatus, onAdded }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [updateItemStatus, setUpdateItemStatus] = useState(false)
  const [newItemStatus, setNewItemStatus] = useState(currentStatus)

  const [form, setForm] = useState({
    type: 'INSPECCION',
    description: '',
    performedBy: '',
    date: new Date().toISOString().slice(0, 10),
    cost: '',
    status: 'COMPLETADO',
    notes: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm(p => ({ ...p, [name]: value }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.description.trim()) { setError('La descripción es obligatoria.'); return }

    setLoading(true)
    try {
      const { error: insertErr } = await supabase.from('inventory_maintenance').insert([{
        itemId,
        type: form.type,
        description: form.description.trim(),
        performedBy: form.performedBy.trim() || null,
        date: form.date,
        cost: form.cost ? parseFloat(form.cost) : null,
        status: form.status,
        notes: form.notes.trim() || null,
      }])

      if (insertErr) { setError(insertErr.message); return }

      if (updateItemStatus) {
        await supabase.from('inventory_items')
          .update({ status: newItemStatus, updatedAt: new Date().toISOString() })
          .eq('id', itemId)
      }

      setOpen(false)
      setForm({ type: 'INSPECCION', description: '', performedBy: '', date: new Date().toISOString().slice(0, 10), cost: '', status: 'COMPLETADO', notes: '' })
      onAdded()
      router.refresh()
    } catch {
      setError('Error al registrar. Intente nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = 'mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm text-gray-900'

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="inline-flex items-center text-sm text-green-600 hover:underline">
        <svg className="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Agregar registro
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
      <p className="text-sm font-semibold text-gray-800">Nuevo registro de mantenimiento / reparación</p>
      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="text-xs font-medium text-gray-700">Tipo *</label>
          <select name="type" value={form.type} onChange={handleChange} className={inputClass}>
            {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-700">Estado del registro *</label>
          <select name="status" value={form.status} onChange={handleChange} className={inputClass}>
            {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs font-medium text-gray-700">Descripción *</label>
          <textarea name="description" rows={3} required value={form.description} onChange={handleChange}
            placeholder="Detalle del trabajo realizado o pendiente..."
            className={inputClass} />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-700">Realizado por</label>
          <input type="text" name="performedBy" value={form.performedBy} onChange={handleChange}
            placeholder="Nombre del técnico o empresa" className={inputClass} />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-700">Fecha *</label>
          <input type="date" name="date" value={form.date} onChange={handleChange} className={inputClass} />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-700">Costo ($)</label>
          <input type="number" name="cost" min="0" step="0.01" value={form.cost} onChange={handleChange}
            placeholder="0.00" className={inputClass} />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-700">Notas adicionales</label>
          <input type="text" name="notes" value={form.notes} onChange={handleChange}
            placeholder="Repuestos usados, observaciones..." className={inputClass} />
        </div>
      </div>

      {/* Actualizar estado del ítem */}
      <div className="border-t border-gray-200 pt-3 space-y-2">
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input type="checkbox" checked={updateItemStatus} onChange={e => setUpdateItemStatus(e.target.checked)}
            className="h-4 w-4 rounded text-green-600" />
          Actualizar también el estado del ítem
        </label>
        {updateItemStatus && (
          <select value={newItemStatus} onChange={e => setNewItemStatus(e.target.value)} className={inputClass}>
            <option value="OPERATIVO">Operativo</option>
            <option value="EN_REPARACION">En reparación</option>
            <option value="FUERA_DE_SERVICIO">Fuera de servicio</option>
            <option value="BAJA">Baja</option>
            <option value="EN_PRESTAMO">En préstamo</option>
          </select>
        )}
      </div>

      <div className="flex gap-2">
        <button type="submit" disabled={loading}
          className="text-sm bg-green-600 text-white px-4 py-1.5 rounded hover:bg-green-700 disabled:opacity-50">
          {loading ? 'Guardando...' : 'Guardar registro'}
        </button>
        <button type="button" onClick={() => setOpen(false)}
          className="text-sm border border-gray-300 px-4 py-1.5 rounded text-gray-600 hover:bg-gray-50">
          Cancelar
        </button>
      </div>
    </form>
  )
}
