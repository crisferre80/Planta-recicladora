'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/db'

export default function NuevaProduccionPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [users, setUsers] = useState<any[]>([])
  const [materials, setMaterials] = useState<any[]>([])
  const [equipment, setEquipment] = useState<any[]>([])
  
  const [formData, setFormData] = useState({
    operatorId: '',
    materialTypeId: '',
    equipmentId: '',
    quantity: '',
    date: new Date().toISOString().slice(0, 16), // formato datetime-local
    notes: ''
  })

  useEffect(() => {
    const fetchData = async () => {
      // Cargar usuarios activos
      const { data: usersData } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('isActive', true)
        .order('name')
      
      if (usersData) setUsers(usersData)

      // Cargar tipos de material activos
      const { data: matData } = await supabase
        .from('material_types')
        .select('id, name, unit')
        .eq('isActive', true)
        .order('name')
      
      if (matData) setMaterials(matData)

      // Cargar equipos operativos
      const { data: eqData } = await supabase
        .from('equipment')
        .select('id, name, code')
        .eq('status', 'OPERATIVO')
        .order('name')
      
      if (eqData) setEquipment(eqData)
    }

    fetchData()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const formatLocalDateTime = (value: string) => {
    const date = new Date(value)
    const pad = (n: number) => n.toString().padStart(2, '0')
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const { data, error: insertError } = await supabase
        .from('production_records')
        .insert([{
          operatorId: formData.operatorId,
          materialTypeId: formData.materialTypeId,
          equipmentId: formData.equipmentId || null,
          quantity: parseFloat(formData.quantity),
          date: formatLocalDateTime(formData.date),
          notes: formData.notes || null
        }])
        .select()

      if (insertError) {
        setError(insertError.message)
        return
      }

      // Redirigir a la lista de producción
      router.push('/produccion')
      router.refresh()
    } catch (err) {
      console.error('Error:', err)
      setError('Error al registrar la producción. Intente nuevamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Registrar Producción
          </h2>
        </div>
      </div>

      <div className="bg-white shadow sm:rounded-lg">
        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">{error}</h3>
                </div>
              </div>
            </div>
          )}

          {/* Información de Producción */}
          <div>
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Información de Producción</h3>
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="materialTypeId" className="block text-sm font-medium text-gray-700">
                  Tipo de Material *
                </label>
                <select
                  name="materialTypeId"
                  id="materialTypeId"
                  required
                  value={formData.materialTypeId}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                >
                  <option value="">Seleccione un material</option>
                  {materials.map(material => (
                    <option key={material.id} value={material.id}>
                      {material.name} ({material.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
                  Cantidad *
                </label>
                <input
                  type="number"
                  name="quantity"
                  id="quantity"
                  required
                  step="0.01"
                  min="0"
                  value={formData.quantity}
                  onChange={handleChange}
                  placeholder="0.00"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="operatorId" className="block text-sm font-medium text-gray-700">
                  Operador *
                </label>
                <select
                  name="operatorId"
                  id="operatorId"
                  required
                  value={formData.operatorId}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                >
                  <option value="">Seleccione operador</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="equipmentId" className="block text-sm font-medium text-gray-700">
                  Equipo
                </label>
                <select
                  name="equipmentId"
                  id="equipmentId"
                  value={formData.equipmentId}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                >
                  <option value="">Sin asignar</option>
                  {equipment.map(eq => (
                    <option key={eq.id} value={eq.id}>
                      {eq.name} ({eq.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                  Fecha y Hora *
                </label>
                <input
                  type="datetime-local"
                  name="date"
                  id="date"
                  required
                  value={formData.date}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                  Notas
                </label>
                <textarea
                  name="notes"
                  id="notes"
                  rows={3}
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Notas adicionales sobre este registro..."
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                />
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="pt-6 border-t border-gray-200 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              {isLoading ? 'Guardando...' : 'Registrar Producción'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
