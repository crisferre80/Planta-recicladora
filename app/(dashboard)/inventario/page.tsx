import { getSupabaseSession } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import PrintButton from '@/app/components/PrintButton'

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
  OPERATIVO:        { label: 'Operativo',         color: 'bg-green-100 text-green-800' },
  EN_REPARACION:    { label: 'En reparación',     color: 'bg-yellow-100 text-yellow-800' },
  FUERA_DE_SERVICIO:{ label: 'Fuera de servicio', color: 'bg-red-100 text-red-800' },
  BAJA:             { label: 'Baja',              color: 'bg-gray-100 text-gray-600' },
  EN_PRESTAMO:      { label: 'En préstamo',       color: 'bg-blue-100 text-blue-800' },
}

export default async function InventarioPage() {
  const { session, supabase } = await getSupabaseSession()
  if (!session) redirect('/login')

  const { data: items } = await supabase
    .from('inventory_items')
    .select('id, name, description, category, serialNumber, brand, model, location, status, photoUrl, createdAt')
    .order('createdAt', { ascending: false })

  const allItems = (items as any[]) ?? []

  // KPIs
  const total      = allItems.length
  const operativo  = allItems.filter(i => i.status === 'OPERATIVO').length
  const reparacion = allItems.filter(i => i.status === 'EN_REPARACION').length
  const fuera      = allItems.filter(i => i.status === 'FUERA_DE_SERVICIO').length

  const byCategory = Object.fromEntries(
    Object.keys(CATEGORY_CONFIG).map(cat => [cat, allItems.filter(i => i.category === cat).length])
  )

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div
        className="relative rounded-2xl overflow-hidden min-h-[140px] flex items-end no-print"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1c1917 60%, #78350f 100%)' }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1581092921461-7031e8fbc93e?w=1200&q=65&auto=format&fit=crop"
          alt="" aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-25"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 to-transparent" />
        <div className="relative z-10 p-6 flex items-end justify-between w-full">
          <div>
            <p className="text-amber-400 text-xs font-semibold uppercase tracking-widest mb-1">Control de Activos</p>
            <h1 className="text-2xl font-bold text-white">Inventario de Planta</h1>
            <p className="text-slate-300 text-sm mt-1">Registro de maquinaria, mobiliario y equipamiento</p>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <PrintButton />
          </div>
        </div>
      </div>

      {/* Print header */}
      <div className="print-only hidden print-report-header">
        <div>
          <div className="print-report-title">Informe de Inventario — Planta de Reciclado</div>
          <div className="print-report-meta">Generado: {new Date().toLocaleString('es-AR')}</div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 no-print">
        <Link
          href="/inventario/escanear"
          className="inline-flex items-center px-3 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 shadow-sm transition-colors"
        >
          📷 Escanear QR
        </Link>
        <Link
          href="/inventario/nuevo"
          className="inline-flex items-center px-3 py-2 border border-transparent rounded-xl text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 shadow-sm transition-colors"
        >
          + Nuevo ítem
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Total registros', value: total,      color: 'bg-gray-700' },
          { label: 'Operativos',      value: operativo,  color: 'bg-green-600' },
          { label: 'En reparación',   value: reparacion, color: 'bg-yellow-500' },
          { label: 'Fuera de servicio', value: fuera,    color: 'bg-red-600' },
        ].map(k => (
          <div key={k.label} className="stat-card p-4 flex items-center gap-4">
            <div className={`${k.color} rounded-xl p-3 flex-shrink-0`}>
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{k.value}</p>
              <p className="text-xs text-slate-500">{k.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Por categoría */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <h2 className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-3">Resumen por categoría</h2>
        <div className="flex flex-wrap gap-2">
          {Object.entries(CATEGORY_CONFIG).map(([cat, cfg]) => (
            byCategory[cat] > 0 ? (
              <span key={cat} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${cfg.color}`}>
                <span>{cfg.icon}</span>
                {cfg.label}: <strong>{byCategory[cat]}</strong>
              </span>
            ) : null
          ))}
        </div>
      </div>

      {/* Lista de ítems */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Todos los ítems</h3>
          <span className="text-xs text-slate-400">{total} registros</span>
        </div>

        {allItems.length === 0 ? (
          <div className="px-4 py-16 text-center">
            <p className="text-4xl mb-3">📦</p>
            <p className="text-sm text-slate-400">No hay ítems registrados aún.</p>
            <Link href="/inventario/nuevo"
              className="mt-4 inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-amber-500 rounded-xl hover:bg-amber-600 transition-colors">
              + Registrar primer ítem
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {allItems.map(item => {
              const catCfg  = CATEGORY_CONFIG[item.category] ?? CATEGORY_CONFIG.OTRO
              const statCfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.OPERATIVO
              return (
                <Link key={item.id} href={`/inventario/${item.id}`}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors">
                  {/* Foto o emoji */}
                  <div className="flex-shrink-0 h-12 w-12 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center">
                    {item.photoUrl ? (
                      <Image src={item.photoUrl} alt={item.name} width={48} height={48} className="object-cover w-full h-full" />
                    ) : (
                      <span className="text-xl">{catCfg.icon}</span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="text-sm font-semibold text-slate-800 truncate">{item.name}</p>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${catCfg.color}`}>{catCfg.label}</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statCfg.color}`}>{statCfg.label}</span>
                    </div>
                    {item.description && (
                      <p className="mt-0.5 text-xs text-slate-400 truncate">{item.description}</p>
                    )}
                    <div className="mt-0.5 flex flex-wrap gap-3 text-xs text-slate-400">
                      {item.serialNumber && <span>N/S: <span className="font-mono">{item.serialNumber}</span></span>}
                      {item.brand && <span>{item.brand}{item.model ? ` · ${item.model}` : ''}</span>}
                      {item.location && <span>📍 {item.location}</span>}
                    </div>
                  </div>

                  <svg className="flex-shrink-0 h-4 w-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
