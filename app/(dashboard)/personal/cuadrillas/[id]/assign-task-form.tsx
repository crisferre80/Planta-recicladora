'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/db'

const MATERIAL_OPTIONS = ['MIXTO', 'PLASTICO', 'CARTON', 'METAL', 'CAUCHO', 'ELECTRONICO', 'ORGANICO']
const ZONE_OPTIONS = [
  { value: 'C', label: 'Zona C (Amarilla · Fase 1)' },
  { value: 'B', label: 'Zona B (Naranja · Fase 2)' },
  { value: 'A', label: 'Zona A (Roja · Fase 3)' },
]

interface Props {
  teamId: string
  defaultZone: string
}

export default function AssignTaskForm({ teamId, defaultZone }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    zone: defaultZone,
    materialPriority: 'MIXTO',
    targetArea: '4800',
    notes: '',
  })

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const today = new Date().toISOString().slice(0, 10)
    try {
      const { error: taskErr } = await supabase.from('daily_tasks').insert([{
        teamId,
        date: today,
        zone: form.zone,
        materialPriority: form.materialPriority,
        targetArea: parseFloat(form.targetArea) || null,
        completedArea: 0,
        status: 'PENDIENTE',
        notes: form.notes || null,
      }])
      if (taskErr) { setError(taskErr.message); return }

      // Crear o actualizar zone_progress del día
      await supabase.from('zone_progress').upsert({
        zone: form.zone, date: today, cleanedArea: 0,
        teamId, phase: form.zone === 'C' ? 1 : form.zone === 'B' ? 2 : 3, status: 'ACTIVO'
      }, { onConflict: 'zone,date' })

      setOpen(false)
      router.refresh()
    } catch {
      setError('Error al asignar tarea.')
    } finally {
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="inline-flex items-center text-sm text-blue-600 hover:underline">
        <svg className="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Asignar tarea de hoy
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
      <p className="text-sm font-semibold text-gray-800">Nueva tarea para hoy</p>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="text-xs font-medium text-gray-700">Zona *</label>
          <select value={form.zone} onChange={e => setForm(p => ({ ...p, zone: e.target.value }))}
            className="mt-0.5 block w-full border border-gray-300 rounded py-1.5 px-2 text-sm">
            {ZONE_OPTIONS.map(z => <option key={z.value} value={z.value}>{z.label}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-700">Material prioritario *</label>
          <select value={form.materialPriority} onChange={e => setForm(p => ({ ...p, materialPriority: e.target.value }))}
            className="mt-0.5 block w-full border border-gray-300 rounded py-1.5 px-2 text-sm">
            {MATERIAL_OPTIONS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-700">Objetivo (m²)</label>
          <input type="number" min="0" step="1" value={form.targetArea}
            onChange={e => setForm(p => ({ ...p, targetArea: e.target.value }))}
            className="mt-0.5 block w-full border border-gray-300 rounded py-1.5 px-2 text-sm" />
          <p className="text-xs text-gray-400 mt-0.5">Capacidad cuadrilla 12: ~4800 m²/día</p>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-700">Notas</label>
          <input type="text" value={form.notes} placeholder="Observaciones del día"
            onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
            className="mt-0.5 block w-full border border-gray-300 rounded py-1.5 px-2 text-sm" />
        </div>
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={loading}
          className="text-sm bg-blue-600 text-white px-4 py-1.5 rounded hover:bg-blue-700 disabled:opacity-50">
          {loading ? 'Guardando...' : 'Asignar tarea'}
        </button>
        <button type="button" onClick={() => setOpen(false)}
          className="text-sm border border-gray-300 px-4 py-1.5 rounded text-gray-600 hover:bg-gray-50">
          Cancelar
        </button>
      </div>
    </form>
  )
}
