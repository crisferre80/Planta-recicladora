import { getSupabaseSession } from '@/lib/supabase-server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import ItemQR from './item-qr'
import MaintenanceForm from './maintenance-form'
import EditItemForm from './edit-item-form'

const CATEGORY_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  MAQUINARIA:      { label: 'Maquinaria',      color: 'bg-blue-100 text-blue-800',    icon: '⚙️' },
  MOBILIARIO:      { label: 'Mobiliario',       color: 'bg-amber-100 text-amber-800',  icon: '🪑' },
  HERRAMIENTA:     { label: 'Herramienta',      color: 'bg-orange-100 text-orange-800',icon: '🔧' },
  VEHICULO:        { label: 'Vehículo',         color: 'bg-gray-100 text-gray-800',    icon: '🚛' },
  ELECTRONICO:     { label: 'Electrónico',      color: 'bg-purple-100 text-purple-800',icon: '💻' },
  INFRAESTRUCTURA: { label: 'Infraestructura',  color: 'bg-green-100 text-green-800',  icon: '🏗️' },
  OTRO:            { label: 'Otro',             color: 'bg-slate-100 text-slate-800',  icon: '📦' },
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  OPERATIVO:         { label: 'Operativo',         color: 'bg-green-100 text-green-800' },
  EN_REPARACION:     { label: 'En reparación',     color: 'bg-yellow-100 text-yellow-800' },
  FUERA_DE_SERVICIO: { label: 'Fuera de servicio', color: 'bg-red-100 text-red-800' },
  BAJA:              { label: 'Baja',              color: 'bg-gray-100 text-gray-600' },
  EN_PRESTAMO:       { label: 'En préstamo',       color: 'bg-blue-100 text-blue-800' },
}

const MAINT_TYPE_LABELS: Record<string, string> = {
  INSPECCION:    'Inspección',
  MANTENIMIENTO: 'Mantenimiento',
  REPARACION:    'Reparación',
  LIMPIEZA:      'Limpieza',
  CALIBRACION:   'Calibración',
  BAJA:          'Baja',
}

const MAINT_STATUS_COLORS: Record<string, string> = {
  COMPLETADO: 'bg-green-100 text-green-800',
  EN_CURSO:   'bg-blue-100 text-blue-800',
  PENDIENTE:  'bg-yellow-100 text-yellow-800',
}

export default async function InventarioItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { session, supabase } = await getSupabaseSession()
  if (!session) redirect('/login')

  const { data: item, error } = await supabase
    .from('inventory_items')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !item) notFound()

  const { data: maintenance } = await supabase
    .from('inventory_maintenance')
    .select('*')
    .eq('itemId', id)
    .order('date', { ascending: false })
    .order('createdAt', { ascending: false })

  const maintenanceList = (maintenance as any[]) ?? []
  const totalCost = maintenanceList.reduce((sum, m) => sum + (m.cost ?? 0), 0)
  const catCfg   = CATEGORY_CONFIG[(item as any).category] ?? CATEGORY_CONFIG.OTRO
  const statCfg  = STATUS_CONFIG[(item as any).status] ?? STATUS_CONFIG.OPERATIVO

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link href="/inventario" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700">
          <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver al inventario
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">{(item as any).name}</h1>
          <span className={`text-sm font-medium px-2.5 py-0.5 rounded-full ${catCfg.color}`}>
            {catCfg.icon} {catCfg.label}
          </span>
          <span className={`text-sm font-medium px-2.5 py-0.5 rounded-full ${statCfg.color}`}>
            {statCfg.label}
          </span>
        </div>
        {(item as any).description && (
          <p className="mt-1 text-gray-600">{(item as any).description}</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Foto + datos */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            {(item as any).photoUrl && (
              <div className="relative h-56 w-full bg-gray-100">
                <Image src={(item as any).photoUrl} alt={(item as any).name}
                  fill sizes="(max-width: 768px) 100vw, 600px" className="object-cover" />
              </div>
            )}
            <div className="p-5 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
              {[
                { label: 'Marca',       value: (item as any).brand },
                { label: 'Modelo',      value: (item as any).model },
                { label: 'Ubicación',   value: (item as any).location },
                { label: 'N° de serie', value: (item as any).serialNumber, mono: true },
                { label: 'Compra',      value: (item as any).purchaseDate ? new Date((item as any).purchaseDate).toLocaleDateString('es-AR') : null },
                { label: 'Valor',       value: (item as any).purchaseValue ? `$${(item as any).purchaseValue.toLocaleString('es-AR')}` : null },
              ].map(f => f.value ? (
                <div key={f.label}>
                  <p className="text-xs font-medium text-gray-500">{f.label}</p>
                  <p className={`text-sm text-gray-900 ${f.mono ? 'font-mono' : ''}`}>{f.value}</p>
                </div>
              ) : null)}
            </div>
          </div>

          {/* Modo de uso */}
          {(item as any).usageInstructions && (
            <div className="bg-white shadow rounded-lg p-5">
              <h2 className="text-base font-semibold text-gray-900 mb-3">📋 Modo de uso</h2>
              <p className="text-sm text-gray-700 whitespace-pre-line">{(item as any).usageInstructions}</p>
            </div>
          )}

          {/* Notas */}
          {(item as any).notes && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h2 className="text-sm font-semibold text-amber-800 mb-1">📝 Notas</h2>
              <p className="text-sm text-amber-700 whitespace-pre-line">{(item as any).notes}</p>
            </div>
          )}

          {/* Editar */}
          <div className="bg-white shadow rounded-lg p-5">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Editar información</h2>
            <EditItemForm item={item as any} />
          </div>

          {/* Historial de mantenimiento */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Historial de mantenimiento</h2>
                {totalCost > 0 && (
                  <p className="text-xs text-gray-500 mt-0.5">Costo acumulado: <span className="font-semibold">${totalCost.toLocaleString('es-AR')}</span></p>
                )}
              </div>
              <span className="text-sm text-gray-500">{maintenanceList.length} registro(s)</span>
            </div>

            <div className="p-5 space-y-4">
              <MaintenanceForm itemId={id} currentStatus={(item as any).status} onAdded={() => {}} />

              {maintenanceList.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">Sin registros de mantenimiento aún.</p>
              ) : (
                <div className="space-y-3 mt-4">
                  {maintenanceList.map((m: any) => (
                    <div key={m.id} className="border border-gray-100 rounded-lg p-4 bg-gray-50">
                      <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">{MAINT_TYPE_LABELS[m.type] ?? m.type}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${MAINT_STATUS_COLORS[m.status] ?? 'bg-gray-100 text-gray-700'}`}>{m.status}</span>
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-3">
                          <span>{new Date(m.date).toLocaleDateString('es-AR')}</span>
                          {m.cost != null && <span className="font-medium text-gray-700">${m.cost.toLocaleString('es-AR')}</span>}
                        </div>
                      </div>
                      <p className="text-sm text-gray-700">{m.description}</p>
                      {m.performedBy && <p className="text-xs text-gray-500 mt-1">Realizado por: {m.performedBy}</p>}
                      {m.notes && <p className="text-xs text-gray-500 italic mt-1">{m.notes}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar: QR */}
        <div className="space-y-4">
          <ItemQR
            itemId={id}
            serialNumber={(item as any).serialNumber ?? id}
            name={(item as any).name}
          />

          {/* Meta info */}
          <div className="bg-white shadow rounded-lg p-4 space-y-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Información del registro</h3>
            <div className="space-y-1.5 text-xs text-gray-600">
              <p>Registrado: <span className="font-medium">{new Date((item as any).createdAt).toLocaleDateString('es-AR')}</span></p>
              <p>Actualizado: <span className="font-medium">{new Date((item as any).updatedAt).toLocaleDateString('es-AR')}</span></p>
              <p className="font-mono text-gray-400 break-all">ID: {id}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
