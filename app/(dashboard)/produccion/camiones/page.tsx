import { getSupabaseSession } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

const DAILY_TRUCK_TARGET = 32
const DAILY_TON_TARGET = 23

const MATERIAL_LABELS: Record<string, string> = {
  MIXTO: 'Mixto',
  PLASTICO: 'Plástico',
  CARTON: 'Cartón',
  METAL: 'Metal',
  CAUCHO: 'Caucho',
  ELECTRONICO: 'Electrónico',
  ORGANICO: 'Orgánico',
}

const MATERIAL_COLORS: Record<string, string> = {
  MIXTO: 'bg-gray-100 text-gray-700',
  PLASTICO: 'bg-blue-100 text-blue-700',
  CARTON: 'bg-yellow-100 text-yellow-700',
  METAL: 'bg-slate-100 text-slate-700',
  CAUCHO: 'bg-orange-100 text-orange-700',
  ELECTRONICO: 'bg-purple-100 text-purple-700',
  ORGANICO: 'bg-green-100 text-green-700',
}

export default async function CamionesPage() {
  const { session, supabase } = await getSupabaseSession()
  if (!session) redirect('/login')

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date(todayStart)
  todayEnd.setDate(todayEnd.getDate() + 1)

  const { data: entries } = await supabase
    .from('truck_entries')
    .select(`
      id, entryTime, truckPlate, grossWeight, tareWeight, netWeight,
      materialCategory, originZone, notes,
      operator:employees!operatorId(firstName, lastName)
    `)
    .gte('entryTime', todayStart.toISOString())
    .lt('entryTime', todayEnd.toISOString())
    .order('entryTime', { ascending: false })

  const totalTrucks = entries?.length ?? 0
  const totalNetKg = entries?.reduce((sum, e: any) => sum + (e.netWeight ?? 0), 0) ?? 0
  const totalTon = totalNetKg / 1000

  const truckPct = Math.min((totalTrucks / DAILY_TRUCK_TARGET) * 100, 100)
  const tonPct = (totalTon / DAILY_TON_TARGET) * 100
  const tonOver = tonPct > 100

  const barColor = (pct: number, over: boolean) => {
    if (over) return 'bg-red-500'
    if (pct >= 80) return 'bg-yellow-400'
    return 'bg-green-500'
  }

  const now = new Date()
  const dayName = now.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative w-20 h-14 flex-shrink-0">
            <Image
              src="/camionrecic.png"
              alt="Camión de reciclaje"
              fill
              sizes="80px"
              className="object-contain"
              priority
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Ingreso de Camiones</h1>
            <p className="mt-1 text-gray-600 capitalize">{dayName}</p>
          </div>
        </div>
        <Link
          href="/produccion/camiones/nuevo"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
        >
          <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Registrar Ingreso
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {/* Camiones */}
        <div className="bg-white shadow rounded-lg p-5">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Camiones hoy</p>
              <p className="mt-1 text-4xl font-bold text-gray-900">
                {totalTrucks}
                <span className="text-lg font-normal text-gray-400"> / {DAILY_TRUCK_TARGET}</span>
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <svg className="h-7 w-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 7h8m-8 4h8m-6 4h4M3 9l3-3m0 0l3 3M6 6v12" />
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>{Math.round(truckPct)}% del objetivo</span>
              <span>{DAILY_TRUCK_TARGET - totalTrucks > 0 ? `Faltan ${DAILY_TRUCK_TARGET - totalTrucks}` : 'Objetivo cumplido'}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className={`h-2 rounded-full transition-all ${barColor(truckPct, false)}`} style={{ width: `${truckPct}%` }} />
            </div>
          </div>
        </div>

        {/* Toneladas */}
        <div className={`shadow rounded-lg p-5 ${tonOver ? 'bg-red-50' : 'bg-white'}`}>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Toneladas ingresadas</p>
              <p className={`mt-1 text-4xl font-bold ${tonOver ? 'text-red-700' : 'text-gray-900'}`}>
                {totalTon.toFixed(2)}
                <span className="text-lg font-normal text-gray-400"> / {DAILY_TON_TARGET} ton</span>
              </p>
            </div>
            <div className={`p-3 rounded-full ${tonOver ? 'bg-red-200' : 'bg-green-100'}`}>
              <svg className={`h-7 w-7 ${tonOver ? 'text-red-600' : 'text-green-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
              </svg>
            </div>
          </div>
          {tonOver && (
            <p className="mt-2 text-sm font-medium text-red-700">
              ⚠ Exceso de {(totalTon - DAILY_TON_TARGET).toFixed(2)} ton sobre el límite diario
            </p>
          )}
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${barColor(tonPct, tonOver)}`}
                style={{ width: `${Math.min(tonPct, 100)}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">{Math.round(tonPct)}% del límite diario</p>
          </div>
        </div>
      </div>

      {/* Tabla de ingresos */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-4 sm:px-6 border-b border-gray-200">
          <h3 className="text-base font-semibold text-gray-900">Registros de hoy</h3>
        </div>

        {!entries || entries.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <div className="relative w-24 h-16 mx-auto mb-4">
              <Image src="/camionrecic.png" alt="Sin camiones" fill sizes="96px" className="object-contain opacity-30" />
            </div>
            <p className="mt-2 text-sm text-gray-500">No hay ingresos registrados hoy.</p>
            <Link href="/produccion/camiones/nuevo"
              className="mt-4 inline-flex items-center text-sm text-green-600 hover:underline">
              Registrar el primer ingreso del día →
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Hora', 'Patente', 'Material', 'Zona', 'Bruto (kg)', 'Tara (kg)', 'Neto (kg)', 'Operador'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {(entries as any[]).map(entry => {
                  const op = entry.operator
                  const hora = new Date(entry.entryTime).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
                  return (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-600">{hora}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 uppercase">{entry.truckPlate}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${MATERIAL_COLORS[entry.materialCategory] ?? 'bg-gray-100 text-gray-700'}`}>
                          {MATERIAL_LABELS[entry.materialCategory] ?? entry.materialCategory}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{entry.originZone ?? '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{entry.grossWeight.toLocaleString('es-AR')}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{entry.tareWeight.toLocaleString('es-AR')}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-green-700">{(entry.netWeight ?? 0).toLocaleString('es-AR')}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {op ? `${op.firstName} ${op.lastName}` : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan={6} className="px-4 py-3 text-sm font-semibold text-gray-700 text-right">Total neto del día:</td>
                  <td className="px-4 py-3 text-sm font-bold text-green-700">{totalNetKg.toLocaleString('es-AR')} kg</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
