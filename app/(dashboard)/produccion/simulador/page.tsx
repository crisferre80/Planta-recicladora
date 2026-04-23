'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface MaterialType {
  id: string
  name: string
  pricePerUnit: number
  dailyAvg: number
}

export default function SimuladorProductividadPage() {
  const [daysPerMonth, setDaysPerMonth] = useState(22) // Días laborales promedio
  const [materials, setMaterials] = useState<MaterialType[]>([
    { id: '1', name: 'Plástico', pricePerUnit: 150, dailyAvg: 2000 },
    { id: '2', name: 'Cartón', pricePerUnit: 80, dailyAvg: 3500 },
    { id: '3', name: 'PET Botellas', pricePerUnit: 200, dailyAvg: 1500 },
    { id: '4', name: 'Orgánicos', pricePerUnit: 30, dailyAvg: 5000 },
    { id: '5', name: 'Húmedos', pricePerUnit: 40, dailyAvg: 2500 },
    { id: '6', name: 'Secos', pricePerUnit: 60, dailyAvg: 3000 },
  ])

  // Cálculos
  const TRUCK_CAPACITY = 20000

  const calculateStats = () => {
    const totalDailyKg = materials.reduce((sum, m) => sum + m.dailyAvg, 0)
    const totalMonthlyKg = totalDailyKg * daysPerMonth
    const totalMonthlyTn = totalMonthlyKg / 1000

    const dailyValue = materials.reduce((sum, m) => sum + (m.dailyAvg * m.pricePerUnit), 0)
    const monthlyValue = dailyValue * daysPerMonth

    const dailyTrucks = Math.floor(totalDailyKg / TRUCK_CAPACITY)
    const monthlyTrucks = Math.floor(totalMonthlyKg / TRUCK_CAPACITY)

    const materialBreakdown = materials.map(m => ({
      ...m,
      monthlyKg: m.dailyAvg * daysPerMonth,
      monthlyValue: m.dailyAvg * m.pricePerUnit * daysPerMonth,
      percentage: totalDailyKg > 0 ? (m.dailyAvg / totalDailyKg) * 100 : 0
    }))

    return {
      totalDailyKg,
      totalMonthlyKg,
      totalMonthlyTn,
      dailyValue,
      monthlyValue,
      dailyTrucks,
      monthlyTrucks,
      materialBreakdown
    }
  }

  const stats = calculateStats()

  const handleMaterialChange = (id: string, field: 'dailyAvg' | 'pricePerUnit', value: number) => {
    setMaterials(materials.map(m => 
      m.id === id ? { ...m, [field]: value } : m
    ))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Simulador de Productividad Mensual
          </h1>
          <p className="mt-2 text-gray-600">
            Ajusta los parámetros para ver estimaciones de producción y ganancias
          </p>
        </div>
        <Link
          href="/produccion"
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          ← Volver a Producción
        </Link>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              Modifica los valores de producción diaria promedio y precio por kilo para cada material.
              El simulador calculará automáticamente las proyecciones mensuales.
            </p>
          </div>
        </div>
      </div>

      {/* Days Configuration */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Configuración del Mes
          </h3>
          <div className="max-w-xs">
            <label htmlFor="daysPerMonth" className="block text-sm font-medium text-gray-700">
              Días laborales por mes
            </label>
            <input
              type="number"
              id="daysPerMonth"
              min="1"
              max="31"
              value={daysPerMonth}
              onChange={(e) => setDaysPerMonth(parseInt(e.target.value) || 22)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="rounded-md bg-green-500 p-3">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Producción Mensual</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.totalMonthlyTn.toFixed(2)} Tn</dd>
                  <dd className="text-xs text-gray-500">{stats.totalMonthlyKg.toLocaleString('es-AR')} kg</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="rounded-md bg-blue-500 p-3">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Ingresos Mensuales</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    ${stats.monthlyValue.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </dd>
                  <dd className="text-xs text-gray-500">
                    ${stats.dailyValue.toLocaleString('es-AR', { minimumFractionDigits: 2 })}/día
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="rounded-md bg-orange-500 p-3">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Camiones/Mes</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.monthlyTrucks}</dd>
                  <dd className="text-xs text-gray-500">{stats.dailyTrucks}/día</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="rounded-md bg-purple-500 p-3">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Promedio Diario</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {(stats.totalDailyKg / 1000).toFixed(2)} Tn
                  </dd>
                  <dd className="text-xs text-gray-500">{stats.totalDailyKg.toLocaleString('es-AR')} kg</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Material Configuration */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Configuración por Tipo de Material
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Ajusta la producción diaria promedio (kg) y el precio por kilogramo para cada tipo de material
          </p>
        </div>
        <div className="px-4 py-5 sm:p-6">
          <div className="space-y-4">
            {stats.materialBreakdown.map((material) => (
              <div key={material.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  {/* Material Name */}
                  <div className="md:col-span-2 flex items-center">
                    <h4 className="text-sm font-semibold text-gray-900">{material.name}</h4>
                  </div>

                  {/* Daily Avg Input */}
                  <div className="md:col-span-3">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Promedio Diario (kg)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={material.dailyAvg}
                      onChange={(e) => handleMaterialChange(material.id, 'dailyAvg', parseFloat(e.target.value) || 0)}
                      className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>

                  {/* Price Input */}
                  <div className="md:col-span-3">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Precio/kg ($)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={material.pricePerUnit}
                      onChange={(e) => handleMaterialChange(material.id, 'pricePerUnit', parseFloat(e.target.value) || 0)}
                      className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>

                  {/* Results */}
                  <div className="md:col-span-4 flex flex-col justify-center">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-600">Mensual:</span>
                        <span className="ml-2 font-medium text-gray-900">
                          {material.monthlyKg.toLocaleString('es-AR')} kg
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Valor:</span>
                        <span className="ml-2 font-bold text-green-600">
                          ${material.monthlyValue.toLocaleString('es-AR', { minimumFractionDigits: 0 })}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${material.percentage}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{material.percentage.toFixed(1)}% del total</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Projection Summary */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-white mb-4">
            Resumen de Proyección Mensual
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-white">
            <div>
              <p className="text-sm opacity-90">Total a Procesar</p>
              <p className="text-3xl font-bold">{stats.totalMonthlyTn.toFixed(2)} Tn</p>
              <p className="text-sm opacity-75">{stats.totalMonthlyKg.toLocaleString('es-AR')} kg en {daysPerMonth} días</p>
            </div>
            <div>
              <p className="text-sm opacity-90">Ingresos Estimados</p>
              <p className="text-3xl font-bold">${stats.monthlyValue.toLocaleString('es-AR', { minimumFractionDigits: 0 })}</p>
              <p className="text-sm opacity-75">${stats.dailyValue.toLocaleString('es-AR', { minimumFractionDigits: 0 })} por día laboral</p>
            </div>
            <div>
              <p className="text-sm opacity-90">Camiones Comercializables</p>
              <p className="text-3xl font-bold">{stats.monthlyTrucks}</p>
              <p className="text-sm opacity-75">~{stats.dailyTrucks} por día (20,000 kg c/u)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
