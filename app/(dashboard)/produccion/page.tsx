import { getSupabaseSession } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import MaterialPriceConfig from './material-price-config'
import ProductionCalendar from './production-calendar'

export default async function ProduccionPage() {
  const { session, supabase } = await getSupabaseSession()

  if (!session) {
    redirect('/login')
  }

  // Obtener registros de producción del día actual
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const formatLocalDateTime = (date: Date) => {
    const pad = (n: number) => n.toString().padStart(2, '0')
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  }

  const { data: productionRecords, error } = await supabase
    .from('production_records')
    .select(`
      *,
      operator:users!operatorId(name),
      materialType:material_types!materialTypeId(name, unit, pricePerUnit),
      equipment:equipment!equipmentId(name, code)
    `)
    .gte('date', formatLocalDateTime(today))
    .lt('date', formatLocalDateTime(tomorrow))
    .order('date', { ascending: false })

  console.log('Production records query:', {
    today: formatLocalDateTime(today),
    tomorrow: formatLocalDateTime(tomorrow),
    recordsCount: productionRecords?.length || 0,
    error: error?.message
  })

  if (error) {
    console.error('Error fetching production records:', error)
  }

  const { data: materialTypes, error: materialTypesError } = await supabase
    .from('material_types')
    .select('id, name, unit, pricePerUnit')
    .eq('isActive', true)
    .order('name')

  if (materialTypesError) {
    console.error('Error fetching material types:', materialTypesError)
  }

  // Calcular estadísticas detalladas por tipo de material
  const materialStats = new Map<string, { quantity: number, value: number, pricePerUnit: number }>()
  let totalKg = 0
  let totalValue = 0

  productionRecords?.forEach((record: any) => {
    const materialName = record.materialType?.name || 'Sin clasificar'
    const quantity = record.quantity || 0
    const pricePerUnit = record.materialType?.pricePerUnit || 0
    const value = quantity * pricePerUnit

    totalKg += quantity
    totalValue += value

    if (!materialStats.has(materialName)) {
      materialStats.set(materialName, { quantity: 0, value: 0, pricePerUnit })
    }

    const current = materialStats.get(materialName)!
    current.quantity += quantity
    current.value += value
  })

  // Convertir a array y ordenar por cantidad
  const materialStatsArray = Array.from(materialStats.entries())
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.quantity - a.quantity)

  // Calcular camiones (20,000 kg por camión)
  const TRUCK_CAPACITY_KG = 20000
  const totalToneladas = totalKg / 1000
  const trucksCompleted = Math.floor(totalKg / TRUCK_CAPACITY_KG)
  const truckProgress = ((totalKg % TRUCK_CAPACITY_KG) / TRUCK_CAPACITY_KG) * 100
  const kgForNextTruck = TRUCK_CAPACITY_KG - (totalKg % TRUCK_CAPACITY_KG)

  // Obtener conteo de equipos operativos
  const { count: equipmentCount } = await supabase
    .from('equipment')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'OPERATIVO')

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Gestión de Producción
          </h1>
          <p className="mt-2 text-gray-600">
            Control y análisis de producción diaria
          </p>
        </div>
        <div className="flex space-x-3">
          <Link
            href="/produccion/simulador"
            className="inline-flex items-center px-4 py-2 border border-blue-300 rounded-md shadow-sm text-sm font-medium text-blue-700 bg-white hover:bg-blue-50"
          >
            <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Simulador Mensual
          </Link>
          <Link
            href="/produccion/nuevo"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
          >
            <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Registrar Producción
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
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
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Hoy</dt>
                  <dd className="text-lg font-medium text-gray-900">{totalKg.toLocaleString('es-AR')} kg</dd>
                  <dd className="text-xs text-gray-500">{totalToneladas.toFixed(2)} Tn</dd>
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
                  <dt className="text-sm font-medium text-gray-500 truncate">Valor Hoy</dt>
                  <dd className="text-lg font-medium text-gray-900">${totalValue.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</dd>
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Camiones Hoy</dt>
                  <dd className="text-lg font-medium text-gray-900">{trucksCompleted}</dd>
                  <dd className="text-xs text-gray-500">{truckProgress.toFixed(1)}% próximo</dd>
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Registros</dt>
                  <dd className="text-lg font-medium text-gray-900">{productionRecords?.length || 0}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="rounded-md bg-yellow-500 p-3">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Equipos</dt>
                  <dd className="text-lg font-medium text-gray-900">{equipmentCount || 0}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ProductionCalendar />

      {/* Truck Loading Progress */}
      {totalKg > 0 && (
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-4">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Progreso de Carga por Material
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Cada material llena camiones separadamente: Cartón, PET y otros materiales.
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="relative w-24 h-24">
                  <Image
                    src="/camionrecic.png"
                    alt="Camión de reciclaje"
                    fill
                    sizes="96px"
                    className="object-contain"
                    priority
                  />
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-orange-600">{trucksCompleted}</p>
                  <p className="text-sm text-gray-500">Camiones completos hoy</p>
                </div>
              </div>
            </div>
            <div className="space-y-6">
              {materialStatsArray.map((material, index) => {
                const materialName = material.name
                const trucksByMaterial = Math.floor(material.quantity / TRUCK_CAPACITY_KG)
                const remainder = material.quantity % TRUCK_CAPACITY_KG
                const progress = material.quantity > 0 ? (remainder / TRUCK_CAPACITY_KG) * 100 : 0
                const remainingKg = material.quantity === 0 ? TRUCK_CAPACITY_KG : remainder === 0 ? TRUCK_CAPACITY_KG : TRUCK_CAPACITY_KG - remainder
                const colorClasses = [
                  'bg-blue-500',
                  'bg-green-500',
                  'bg-yellow-500',
                  'bg-purple-500',
                  'bg-pink-500',
                  'bg-indigo-500',
                  'bg-red-500',
                  'bg-teal-500'
                ]
                const color = colorClasses[index % colorClasses.length]
                const truckLabel = materialName.toLowerCase().includes('cart')
                  ? 'Camión Cartón'
                  : materialName.toLowerCase().includes('pet')
                    ? 'Camión PET'
                    : `Camión ${materialName}`

                return (
                  <div key={materialName} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900">{truckLabel}</h4>
                        <p className="text-xs text-gray-500">Carga exclusiva de {materialName}</p>
                      </div>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium text-white ${color}`}>
                        {trucksByMaterial} completos
                      </span>
                    </div>
                    <div className="grid gap-3 md:grid-cols-3 md:items-center">
                      <div className="md:col-span-2">
                        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                          <div
                            className={`${color} h-4 rounded-full transition-all duration-500`}
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-sm text-gray-600">
                        <p>{progress.toFixed(1)}% del próximo camión</p>
                        <p>{remainingKg.toLocaleString('es-AR')} kg faltantes</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Material Type Analysis */}
      {materialStatsArray.length > 0 && (
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Análisis por Tipo de Material
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Desglose de producción y valores del día
            </p>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {materialStatsArray.map((material, index) => {
                const percentage = totalKg > 0 ? (material.quantity / totalKg) * 100 : 0
                const trucksByMaterial = Math.floor(material.quantity / TRUCK_CAPACITY_KG)
                const remainder = material.quantity % TRUCK_CAPACITY_KG
                const nextTruckProgress = (remainder / TRUCK_CAPACITY_KG) * 100
                const remainingKg = remainder === 0 ? TRUCK_CAPACITY_KG : TRUCK_CAPACITY_KG - remainder
                const colors = [
                  'bg-blue-500',
                  'bg-green-500',
                  'bg-yellow-500',
                  'bg-purple-500',
                  'bg-pink-500',
                  'bg-indigo-500',
                  'bg-red-500',
                  'bg-teal-500'
                ]
                const color = colors[index % colors.length]
                
                const truckLabel = material.name.toLowerCase().includes('cart')
                  ? 'Camión Cartón'
                  : material.name.toLowerCase().includes('pet')
                    ? 'Camión PET'
                    : `Camión ${material.name}`

                return (
                  <div key={material.name} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900">{truckLabel}</h4>
                        <p className="text-xs text-gray-500">Carga exclusiva de {material.name}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium text-white ${color}`}>
                        {percentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Cantidad:</span>
                        <span className="font-medium text-gray-900">{material.quantity.toLocaleString('es-AR')} kg</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Precio/kg:</span>
                        <span className="font-medium text-gray-900">${(material.pricePerUnit ?? 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Camiones completos:</span>
                        <span className="font-medium text-gray-900">{trucksByMaterial}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Faltan para próximo camión:</span>
                        <span className="font-medium text-gray-900">{remainingKg.toLocaleString('es-AR')} kg</span>
                      </div>
                      <div className="pt-2 border-t border-gray-300">
                        <div className="flex justify-between text-gray-600 text-xs">
                          <span>Progreso camión</span>
                          <span>{nextTruckProgress.toFixed(1)}%</span>
                        </div>
                        <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`${color} h-2 rounded-full transition-all duration-300`}
                            style={{ width: `${nextTruckProgress}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-gray-300">
                        <span className="text-gray-700 font-medium">Valor Total:</span>
                        <span className="font-bold text-green-600">${material.value.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {materialTypes && materialTypes.length > 0 && (
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Configuración de Precio por Material
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Ajusta el precio por kilo de cada material para que los cálculos de valor sean precisos.
            </p>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <MaterialPriceConfig materialTypes={materialTypes} />
          </div>
        </div>
      )}

      {/* Production Records List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Registros de Hoy
          </h3>
        </div>
        <ul className="divide-y divide-gray-200">
          {productionRecords && productionRecords.length > 0 ? (
            productionRecords.map((record: any) => (
              <li key={record.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-green-600 truncate">
                        {record.materialType?.name || 'Material desconocido'} - {record.quantity} {record.materialType?.unit || 'kg'}
                      </p>
                      <div className="ml-2 flex-shrink-0">
                        <p className="text-sm font-bold text-green-800">
                          ${((record.quantity || 0) * (record.materialType?.pricePerUnit || 0)).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500">
                          <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          {record.operator?.name || 'Sin operador'}
                        </p>
                        {record.equipment && (
                          <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                            <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                            </svg>
                            {record.equipment.name} ({record.equipment.code})
                          </p>
                        )}
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {new Date(record.date).toLocaleTimeString('es-AR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>
                    {record.notes && (
                      <p className="mt-2 text-sm text-gray-600 italic">
                        {record.notes}
                      </p>
                    )}
                  </div>
                </div>
              </li>
            ))
          ) : (
            <li className="px-4 py-12 sm:px-6 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Sin registros</h3>
              <p className="mt-1 text-sm text-gray-500">Comienza agregando un registro de producción.</p>
              <div className="mt-6">
                <Link
                  href="/produccion/nuevo"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                >
                  <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Registrar Producción
                </Link>
              </div>
            </li>
          )}
        </ul>
      </div>
    </div>
  )
}

