'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/db'

const ZONE_OPTIONS = [
  { value: 'C', label: 'Zona C (Amarilla - Perimetral · Fase 1)' },
  { value: 'B', label: 'Zona B (Naranja - Intermedia · Fase 2)' },
  { value: 'A', label: 'Zona A (Roja - Núcleo · Fase 3 — requiere maquinaria especial)' },
]

export default function NuevaCuadrillaPage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [employees, setEmployees] = useState<any[]>([])
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [createdTeamId, setCreatedTeamId] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    zone: 'C',
    supervisorId: '',
  })

  useEffect(() => {
    supabase
      .from('employees')
      .select('id, firstName, lastName, position, photoUrl')
      .eq('status', 'ACTIVO')
      .order('firstName')
      .then(({ data }) => { if (data) setEmployees(data) })
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const toggleMember = (id: string) => {
    setSelectedMembers(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    )
  }

  const handleStep1 = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      const { data, error: insertError } = await supabase
        .from('work_teams')
        .insert([{
          name: formData.name.trim(),
          zone: formData.zone,
          supervisorId: formData.supervisorId || null,
          isActive: true,
        }])
        .select()
        .single()

      if (insertError) { setError(insertError.message); return }
      setCreatedTeamId(data.id)
      setStep(2)
    } catch {
      setError('Error al crear la cuadrilla.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleStep2 = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      if (selectedMembers.length > 0) {
        const { error: membersError } = await supabase
          .from('team_members')
          .insert(selectedMembers.map(employeeId => ({ teamId: createdTeamId, employeeId })))

        if (membersError) { setError(membersError.message); return }
      }
      router.push('/personal/cuadrillas')
      router.refresh()
    } catch {
      setError('Error al asignar miembros.')
    } finally {
      setIsLoading(false)
    }
  }

  const inputClass = 'mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm'

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link href="/personal/cuadrillas" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700">
          <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver a cuadrillas
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">Nueva Cuadrilla</h1>
      </div>

      {/* Stepper */}
      <div className="flex items-center space-x-4">
        {[{ n: 1, label: 'Datos del equipo' }, { n: 2, label: 'Asignar miembros' }].map(s => (
          <div key={s.n} className="flex items-center">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold
              ${step === s.n ? 'bg-blue-600 text-white' : step > s.n ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
              {step > s.n ? '✓' : s.n}
            </div>
            <span className={`ml-2 text-sm ${step === s.n ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>{s.label}</span>
            {s.n < 2 && <div className="ml-4 h-0.5 w-12 bg-gray-200" />}
          </div>
        ))}
      </div>

      <div className="bg-white shadow sm:rounded-lg">
        {step === 1 ? (
          <form onSubmit={handleStep1} className="space-y-5 p-6">
            {error && <div className="rounded-md bg-red-50 p-4"><p className="text-sm text-red-800">{error}</p></div>}

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nombre de la cuadrilla *</label>
              <input type="text" name="name" id="name" required placeholder="Ej: Cuadrilla D"
                value={formData.name} onChange={handleChange} className={inputClass} />
            </div>

            <div>
              <label htmlFor="zone" className="block text-sm font-medium text-gray-700">Zona asignada *</label>
              <select name="zone" id="zone" required value={formData.zone} onChange={handleChange} className={inputClass}>
                {ZONE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            <div>
              <label htmlFor="supervisorId" className="block text-sm font-medium text-gray-700">Supervisor</label>
              <select name="supervisorId" id="supervisorId" value={formData.supervisorId} onChange={handleChange} className={inputClass}>
                <option value="">— Sin supervisor asignado —</option>
                {employees.map(e => (
                  <option key={e.id} value={e.id}>{e.firstName} {e.lastName} — {e.position}</option>
                ))}
              </select>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <Link href="/personal/cuadrillas"
                className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                Cancelar
              </Link>
              <button type="submit" disabled={isLoading}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50">
                {isLoading ? 'Creando...' : 'Continuar →'}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleStep2} className="p-6 space-y-5">
            {error && <div className="rounded-md bg-red-50 p-4"><p className="text-sm text-red-800">{error}</p></div>}

            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">
                Seleccioná los miembros de la cuadrilla ({selectedMembers.length} seleccionados)
              </p>
              <div className="space-y-2 max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-2">
                {employees.map(emp => {
                  const checked = selectedMembers.includes(emp.id)
                  return (
                    <label key={emp.id}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors
                        ${checked ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50 border border-transparent'}`}>
                      <input type="checkbox" checked={checked} onChange={() => toggleMember(emp.id)}
                        className="h-4 w-4 text-blue-600 rounded border-gray-300" />
                      {emp.photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={emp.photoUrl} alt={`${emp.firstName} ${emp.lastName}`}
                          className="h-8 w-8 rounded-full object-cover border border-gray-200 flex-shrink-0" />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-white">{emp.firstName?.[0]}{emp.lastName?.[0]}</span>
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900">{emp.firstName} {emp.lastName}</p>
                        <p className="text-xs text-gray-500">{emp.position}</p>
                      </div>
                    </label>
                  )
                })}
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button type="submit" disabled={isLoading}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50">
                {isLoading ? 'Guardando...' : selectedMembers.length === 0 ? 'Crear sin miembros' : `Crear con ${selectedMembers.length} miembros`}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
