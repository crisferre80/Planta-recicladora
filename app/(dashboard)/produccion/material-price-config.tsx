'use client'

import { useState } from 'react'
import { supabase } from '@/lib/db'

interface MaterialType {
  id: string
  name: string
  unit: string
  pricePerUnit: number | null
}

interface Props {
  materialTypes: MaterialType[]
}

export default function MaterialPriceConfig({ materialTypes }: Props) {
  const [materials, setMaterials] = useState<MaterialType[]>(materialTypes)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string>('')

  const handlePriceChange = (id: string, value: string) => {
    setMaterials(materials.map(material =>
      material.id === id
        ? { ...material, pricePerUnit: value === '' ? null : parseFloat(value) }
        : material
    ))
  }

  const handleSave = async (id: string) => {
    const material = materials.find(item => item.id === id)
    if (!material) return

    const price = material.pricePerUnit ?? 0
    if (isNaN(price) || price < 0) {
      setStatusMessage('Ingrese un precio válido mayor o igual a 0')
      return
    }

    setSavingId(id)
    setStatusMessage('')

    const { error } = await supabase
      .from('material_types')
      .update({ pricePerUnit: price })
      .eq('id', id)
      .select()

    setSavingId(null)

    if (error) {
      setStatusMessage(`Error al actualizar ${material.name}: ${error.message}`)
      return
    }

    setStatusMessage(`Precio actualizado para ${material.name}`)
  }

  return (
    <div className="space-y-4">
      {statusMessage && (
        <div className="rounded-md bg-blue-50 p-4 text-sm text-blue-700">
          {statusMessage}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {materials.map(material => (
          <div key={material.id} className="bg-gray-50 rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-sm font-semibold text-gray-900">{material.name}</h4>
                <p className="text-xs text-gray-500">Precio actual por kg</p>
              </div>
              <span className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-medium text-indigo-700">
                {material.unit}
              </span>
            </div>
            <div className="grid gap-3">
              <div>
                <label htmlFor={`price-${material.id}`} className="text-xs font-medium text-gray-700">
                  Precio por kg ($)
                </label>
                <input
                  id={`price-${material.id}`}
                  type="number"
                  min="0"
                  step="0.01"
                  value={material.pricePerUnit ?? ''}
                  onChange={(event) => handlePriceChange(material.id, event.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                />
              </div>
              <button
                type="button"
                onClick={() => handleSave(material.id)}
                disabled={savingId === material.id}
                className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {savingId === material.id ? 'Guardando...' : 'Guardar precio'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
