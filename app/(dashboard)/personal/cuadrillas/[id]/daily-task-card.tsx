'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/db'

const MATERIAL_OPTIONS = ['MIXTO', 'PLASTICO', 'CARTON', 'METAL', 'CAUCHO', 'ELECTRONICO', 'ORGANICO']
const ZONE_OPTIONS = ['A', 'B', 'C']
const STATUS_CONFIG: Record<string, { label: string; color: string; next?: string; nextLabel?: string }> = {
  PENDIENTE:   { label: 'Pendiente',   color: 'bg-gray-100 text-gray-700',  next: 'EN_PROGRESO', nextLabel: 'Iniciar' },
  EN_PROGRESO: { label: 'En progreso', color: 'bg-blue-100 text-blue-700',  next: 'COMPLETADO',  nextLabel: 'Marcar completado' },
  COMPLETADO:  { label: 'Completado',  color: 'bg-green-100 text-green-700' },
}

interface Props {
  task: { id: string; status: string; zone: string; materialPriority: string; targetArea: number | null; completedArea: number }
  teamId: string
}

export default function DailyTaskCard({ task, teamId }: Props) {
  const router = useRouter()
  const [status, setStatus] = useState(task.status)
  const [completedArea, setCompletedArea] = useState(task.completedArea)
  const [editingArea, setEditingArea] = useState(false)
  const [areaInput, setAreaInput] = useState(task.completedArea.toString())
  const [loading, setLoading] = useState(false)
  const [showAssign, setShowAssign] = useState(false)
  const [assignData, setAssignData] = useState({ zone: task.zone, materialPriority: task.materialPriority, targetArea: task.targetArea?.toString() ?? '' })
  const [assignError, setAssignError] = useState('')

  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.PENDIENTE

  const handleAdvanceStatus = async () => {
    if (!cfg.next) return
    setLoading(true)
    await supabase.from('daily_tasks').update({ status: cfg.next, updatedAt: new Date().toISOString() }).eq('id', task.id)
    setStatus(cfg.next)
    setLoading(false)
    router.refresh()
  }

  const handleUpdateArea = async (e: FormEvent) => {
    e.preventDefault()
    const val = parseFloat(areaInput)
    if (isNaN(val) || val < 0) return
    setLoading(true)
    const today = new Date().toISOString().slice(0, 10)
    await supabase.from('daily_tasks').update({ completedArea: val, updatedAt: new Date().toISOString() }).eq('id', task.id)
    // Upsert zone_progress
    await supabase.from('zone_progress').upsert({
      zone: task.zone, date: today, cleanedArea: val,
      teamId, phase: task.zone === 'C' ? 1 : task.zone === 'B' ? 2 : 3, status: 'ACTIVO'
    }, { onConflict: 'zone,date' })
    setCompletedArea(val)
    setEditingArea(false)
    setLoading(false)
    router.refresh()
  }

  const handleReassign = async (e: FormEvent) => {
    e.preventDefault()
    setAssignError('')
    setLoading(true)
    const { error } = await supabase.from('daily_tasks')
      .update({ zone: assignData.zone, materialPriority: assignData.materialPriority, targetArea: parseFloat(assignData.targetArea) || null, updatedAt: new Date().toISOString() })
      .eq('id', task.id)
    if (error) { setAssignError(error.message); setLoading(false); return }
    setShowAssign(false)
    setLoading(false)
    router.refresh()
  }

  const handleDeleteTask = async () => {
    const confirmed = window.confirm('¿Eliminar esta tarea programada? Esta acción no se puede deshacer.')
    if (!confirmed) return
    setLoading(true)
    await supabase.from('daily_tasks').delete().eq('id', task.id)
    setLoading(false)
    router.refresh()
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-900">{assignData.materialPriority} — Zona {assignData.zone}</p>
          <p className="text-xs text-gray-500 mt-0.5">Tarea del día</p>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.color}`}>{cfg.label}</span>
      </div>

      {/* Progreso m² */}
      {task.targetArea && (
        <div>
          {editingArea ? (
            <form onSubmit={handleUpdateArea} className="flex items-center gap-2">
              <input type="number" min="0" step="1" value={areaInput} onChange={e => setAreaInput(e.target.value)}
                className="w-28 border border-gray-300 rounded px-2 py-1 text-sm" />
              <span className="text-xs text-gray-500">/ {task.targetArea.toLocaleString('es-AR')} m²</span>
              <button type="submit" disabled={loading}
                className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 disabled:opacity-50">OK</button>
              <button type="button" onClick={() => setEditingArea(false)} className="text-xs text-gray-500 hover:text-gray-700">✕</button>
            </form>
          ) : (
            <button onClick={() => setEditingArea(true)} className="text-left w-full group">
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>{completedArea.toLocaleString('es-AR')} / {task.targetArea.toLocaleString('es-AR')} m²</span>
                <span className="text-blue-600 group-hover:underline">editar</span>
              </div>
              <div className="w-full bg-white rounded-full h-2 border border-blue-100">
                <div className="h-2 rounded-full bg-blue-500 transition-all"
                  style={{ width: `${Math.min((completedArea / task.targetArea) * 100, 100)}%` }} />
              </div>
            </button>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {cfg.next && (
          <button onClick={handleAdvanceStatus} disabled={loading}
            className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 disabled:opacity-50">
            {loading ? '...' : cfg.nextLabel}
          </button>
        )}
        <button onClick={() => setShowAssign(!showAssign)}
          className="text-xs border border-gray-300 text-gray-600 px-3 py-1.5 rounded hover:bg-gray-50">
          Reasignar tarea
        </button>
        <button onClick={handleDeleteTask}
          disabled={loading}
          className="text-xs border border-red-300 text-red-700 px-3 py-1.5 rounded hover:bg-red-50 disabled:opacity-50">
          {loading ? '...' : 'Eliminar tarea'}
        </button>
      </div>

      {showAssign && (
        <form onSubmit={handleReassign} className="border-t border-blue-200 pt-3 space-y-2">
          {assignError && <p className="text-xs text-red-600">{assignError}</p>}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-medium text-gray-700">Zona</label>
              <select value={assignData.zone} onChange={e => setAssignData(p => ({ ...p, zone: e.target.value }))}
                className="mt-0.5 block w-full border border-gray-300 rounded py-1.5 px-2 text-sm">
                {ZONE_OPTIONS.map(z => <option key={z} value={z}>Zona {z}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700">Material</label>
              <select value={assignData.materialPriority} onChange={e => setAssignData(p => ({ ...p, materialPriority: e.target.value }))}
                className="mt-0.5 block w-full border border-gray-300 rounded py-1.5 px-2 text-sm">
                {MATERIAL_OPTIONS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700">Objetivo (m²)</label>
            <input type="number" min="0" step="1" value={assignData.targetArea}
              onChange={e => setAssignData(p => ({ ...p, targetArea: e.target.value }))}
              className="mt-0.5 block w-full border border-gray-300 rounded py-1.5 px-2 text-sm" />
          </div>
          <button type="submit" disabled={loading}
            className="text-xs bg-gray-800 text-white px-3 py-1.5 rounded hover:bg-gray-900 disabled:opacity-50">
            {loading ? '...' : 'Guardar cambios'}
          </button>
        </form>
      )}
    </div>
  )
}
