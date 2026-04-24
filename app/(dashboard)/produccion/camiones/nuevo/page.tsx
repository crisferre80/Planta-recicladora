'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/db'

const MATERIAL_OPTIONS = [
  { value: 'MIXTO',       label: 'Mixto (sin clasificar)' },
  { value: 'PLASTICO',    label: 'Plástico' },
  { value: 'CARTON',      label: 'Cartón / Papel' },
  { value: 'METAL',       label: 'Metal / Aluminio' },
  { value: 'CAUCHO',      label: 'Caucho / Cubiertas' },
  { value: 'ELECTRONICO', label: 'Electrónico / RAEE' },
  { value: 'ORGANICO',    label: 'Orgánico' },
]

const ZONE_OPTIONS = [
  { value: 'EXTERNO', label: 'Externo (fuera del predio)' },
  { value: 'A',       label: 'Zona A (Roja - Núcleo)' },
  { value: 'B',       label: 'Zona B (Naranja - Intermedia)' },
  { value: 'C',       label: 'Zona C (Amarilla - Perimetral)' },
]

export default function NuevoCamionPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [employees, setEmployees] = useState<any[]>([])

  const [formData, setFormData] = useState({
    truckPlate: '',
    grossWeight: '',
    tareWeight: '',
    materialCategory: 'MIXTO',
    originZone: 'EXTERNO',
    operatorId: '',
    notes: '',
    entryTime: new Date().toISOString().slice(0, 16),
  })

  useEffect(() => {
    supabase
      .from('employees')
      .select('id, firstName, lastName')
      .eq('status', 'ACTIVO')
      .order('firstName')
      .then(({ data }) => { if (data) setEmployees(data) })
  }, [])

  const netWeight = formData.grossWeight && formData.tareWeight
    ? Math.max(0, parseFloat(formData.grossWeight) - parseFloat(formData.tareWeight))
    : null

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    const gross = parseFloat(formData.grossWeight)
    const tare = parseFloat(formData.tareWeight)

    if (isNaN(gross) || gross <= 0) { setError('El peso bruto debe ser mayor a 0.'); return }
    if (isNaN(tare) || tare <= 0) { setError('La tara debe ser mayor a 0.'); return }
    if (tare >= gross) { setError('La tara no puede ser mayor o igual al peso bruto.'); return }

    setIsLoading(true)
    try {
      const { error: insertError } = await supabase.from('truck_entries').insert([{
        truckPlate: formData.truckPlate.toUpperCase().trim(),
        grossWeight: gross,
        tareWeight: tare,
        materialCategory: formData.materialCategory,
        originZone: formData.originZone,
        operatorId: formData.operatorId || null,
        notes: formData.notes || null,
        entryTime: new Date(formData.entryTime).toISOString(),
      }])

      if (insertError) { setError(insertError.message); return }
      router.push('/produccion/camiones')
      router.refresh()
    } catch (err) {
      setError('Error al registrar. Intente nuevamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const inputClass = 'mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm'

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link href="/produccion/camiones" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700">
          <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver a ingresos
        </Link>
        <div className="mt-2 flex items-center gap-4">
          <div className="relative w-16 h-12 flex-shrink-0">
            <Image
              src="/camionrecic.png"
              alt="Camión de reciclaje"
              fill
              sizes="64px"
              className="object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Registrar Ingreso de Camión</h1>
        </div>
      </div>

      <div className="bg-white shadow sm:rounded-lg">
        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="truckPlate" className="block text-sm font-medium text-gray-700">Patente del camión *</label>
              <input type="text" name="truckPlate" id="truckPlate" required
                placeholder="Ej: ABC123" value={formData.truckPlate} onChange={handleChange}
                className={`${inputClass} uppercase`} />
            </div>
            <div>
              <label htmlFor="entryTime" className="block text-sm font-medium text-gray-700">Fecha y hora de ingreso *</label>
              <input type="datetime-local" name="entryTime" id="entryTime" required
                value={formData.entryTime} onChange={handleChange} className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div>
              <label htmlFor="grossWeight" className="block text-sm font-medium text-gray-700">Peso bruto (kg) *</label>
              <input type="number" name="grossWeight" id="grossWeight" required
                min="0" step="1" placeholder="Ej: 12500"
                value={formData.grossWeight} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label htmlFor="tareWeight" className="block text-sm font-medium text-gray-700">Tara del camión (kg) *</label>
              <input type="number" name="tareWeight" id="tareWeight" required
                min="0" step="1" placeholder="Ej: 7000"
                value={formData.tareWeight} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Peso neto (kg)</label>
              <div className={`mt-1 block w-full border rounded-md py-2 px-3 sm:text-sm font-semibold
                ${netWeight !== null && netWeight > 0 ? 'bg-green-50 border-green-300 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-400'}`}>
                {netWeight !== null ? netWeight.toLocaleString('es-AR') : '—'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="materialCategory" className="block text-sm font-medium text-gray-700">Categoría de material *</label>
              <select name="materialCategory" id="materialCategory" required
                value={formData.materialCategory} onChange={handleChange} className={inputClass}>
                {MATERIAL_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="originZone" className="block text-sm font-medium text-gray-700">Zona de origen *</label>
              <select name="originZone" id="originZone" required
                value={formData.originZone} onChange={handleChange} className={inputClass}>
                {ZONE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="operatorId" className="block text-sm font-medium text-gray-700">Operador registrador</label>
            <select name="operatorId" id="operatorId"
              value={formData.operatorId} onChange={handleChange} className={inputClass}>
              <option value="">— Sin asignar —</option>
              {employees.map(e => (
                <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notas</label>
            <textarea name="notes" id="notes" rows={2}
              placeholder="Observaciones, estado del vehículo, etc."
              value={formData.notes} onChange={handleChange} className={inputClass} />
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <Link href="/produccion/camiones"
              className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
              Cancelar
            </Link>
            <button type="submit" disabled={isLoading}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50">
              {isLoading ? 'Registrando...' : 'Registrar Ingreso'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
