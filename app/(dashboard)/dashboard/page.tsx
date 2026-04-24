import { getSupabaseSession } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import PrintButton from '@/app/components/PrintButton'

export default async function DashboardPage() {
  const { session, supabase } = await getSupabaseSession()

  if (!session) {
    redirect('/login')
  }

  // Obtener datos del usuario desde public.users
  const { data: userData } = await supabase
    .from('users')
    .select('name, role, avatarUrl')
    .eq('id', session.user.id)
    .single()

  // Obtener estadísticas
  const { count: employeesCount } = await supabase
    .from('employees')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'ACTIVO')

  const { count: equipmentCount } = await supabase
    .from('equipment')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'OPERATIVO')

  const { count: materialsCount } = await supabase
    .from('material_types')
    .select('*', { count: 'exact', head: true })
    .eq('isActive', true)

  const { count: alertsCount } = await supabase
    .from('alerts')
    .select('*', { count: 'exact', head: true })
    .eq('isRead', false)

  // Datos de camiones de hoy
  const todayISO = new Date().toISOString().slice(0, 10)
  const { data: truckRows } = await supabase
    .from('truck_entries')
    .select('netWeight')
    .gte('entryTime', `${todayISO}T00:00:00`)
    .lt('entryTime', `${todayISO}T23:59:59`)

  const truckCount = truckRows?.length ?? 0
  const truckNetKg = (truckRows as any[] ?? []).reduce((sum: number, r: any) => sum + (r.netWeight ?? 0), 0)
  const truckTons = truckNetKg / 1000
  const truckOverLimit = truckTons > 23

  // Producción de hoy para % recuperación
  const { data: productionRows } = await supabase
    .from('production_records')
    .select('quantity')
    .gte('date', `${todayISO} 00:00:00`)
    .lt('date', `${todayISO} 23:59:59`)

  const totalProdKg = (productionRows as any[] ?? []).reduce((sum: number, r: any) => sum + (r.quantity ?? 0), 0)
  const recoveryPct = truckNetKg > 0 ? (totalProdKg / truckNetKg) * 100 : null

  const roleLabels: Record<string, string> = {
    ADMIN: 'Administrador', SUPERVISOR: 'Supervisor', OPERADOR: 'Operador', CONTADOR: 'Contador'
  }

  return (
    <div className="space-y-6">
      {/* ── HERO BANNER ─────────────────────────────────────── */}
      <div
        className="relative rounded-2xl overflow-hidden min-h-[160px] sm:min-h-[200px] flex items-end no-print"
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e3a2f 60%, #064e3b 100%)',
        }}
      >
        {/* Background decorative image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=1400&q=70&auto=format&fit=crop"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-transparent" />

        <div className="relative z-10 p-6 sm:p-8 w-full">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-emerald-400 text-xs font-semibold uppercase tracking-widest mb-1">
                Panel de Control
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
                Bienvenido, {userData?.name?.split(' ')[0] || session.user.email?.split('@')[0]}
              </h1>
              <p className="mt-1 text-slate-300 text-sm">
                {roleLabels[userData?.role] || 'Usuario'} &mdash; {new Date().toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <PrintButton label="Imprimir Resumen" />
            </div>
          </div>
        </div>
      </div>

      {/* ── PRINT HEADER (solo en impresión) ────────────────── */}
      <div className="print-only hidden print-report-header">
        <div>
          <div className="print-report-title">Dashboard — Planta de Reciclado</div>
          <div className="print-report-meta">
            Termas de Río Hondo · Generado: {new Date().toLocaleString('es-AR')}
          </div>
        </div>
      </div>

      {/* ── KPI GRID ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {/* Personal Activo */}
        <div className="stat-card p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Personal Activo</p>
              <p className="mt-2 text-3xl font-bold text-slate-800">{employeesCount || 0}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-3 h-1 rounded-full bg-emerald-100">
            <div className="h-1 rounded-full bg-emerald-500" style={{ width: '70%' }} />
          </div>
        </div>

        {/* Equipos Operativos */}
        <div className="stat-card p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Equipos Operativos</p>
              <p className="mt-2 text-3xl font-bold text-slate-800">{equipmentCount || 0}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-sky-500 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
            </div>
          </div>
          <div className="mt-3 h-1 rounded-full bg-sky-100">
            <div className="h-1 rounded-full bg-sky-500" style={{ width: '60%' }} />
          </div>
        </div>

        {/* Tipos de Material */}
        <div className="stat-card p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Tipos de Material</p>
              <p className="mt-2 text-3xl font-bold text-slate-800">{materialsCount || 0}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
          <div className="mt-3 h-1 rounded-full bg-amber-100">
            <div className="h-1 rounded-full bg-amber-500" style={{ width: '80%' }} />
          </div>
        </div>

        {/* Alertas */}
        <div className="stat-card p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Alertas Sin Leer</p>
              <p className={`mt-2 text-3xl font-bold ${(alertsCount || 0) > 0 ? 'text-red-600' : 'text-slate-800'}`}>
                {alertsCount || 0}
              </p>
            </div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${(alertsCount || 0) > 0 ? 'bg-red-500' : 'bg-slate-400'}`}>
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
          </div>
          {(alertsCount || 0) > 0 && (
            <div className="mt-3">
              <Link href="/alertas" className="text-xs text-red-600 font-semibold hover:underline">
                Ver alertas →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ── TRUCKS + RECOVERY ───────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className={`stat-card p-5 ${truckOverLimit ? 'border-red-300 bg-red-50/60' : ''}`}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Camiones Hoy</p>
              <p className={`mt-2 text-3xl font-bold ${truckOverLimit ? 'text-red-600' : 'text-slate-800'}`}>
                {truckCount} <span className="text-base font-normal text-slate-400">/ 32</span>
              </p>
              <p className={`text-sm font-medium mt-1 ${truckOverLimit ? 'text-red-600' : 'text-slate-500'}`}>
                {truckTons.toFixed(2)} Tn {truckOverLimit ? '⚠ supera límite (23 Tn)' : '/ 23 Tn máx.'}
              </p>
            </div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${truckOverLimit ? 'bg-red-500' : 'bg-slate-700'}`}>
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l1.5 1.5M13 16H3m10 0h5l1.5-1.5V11l-2-4H13v9z" />
              </svg>
            </div>
          </div>
          <div className="mt-3">
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>Progreso</span>
              <span>{Math.min(100, Math.round((truckCount / 32) * 100))}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-200">
              <div
                className={`h-1.5 rounded-full ${truckOverLimit ? 'bg-red-500' : 'bg-slate-700'}`}
                style={{ width: `${Math.min(100, (truckCount / 32) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="stat-card p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">% Recuperación</p>
              <p className="mt-2 text-3xl font-bold text-teal-600">
                {recoveryPct !== null ? `${recoveryPct.toFixed(1)}%` : '--'}
              </p>
              <p className="text-sm text-slate-500 mt-1">Producción / ingreso bruto hoy</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-teal-500 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
          </div>
          {recoveryPct !== null && (
            <div className="mt-3">
              <div className="h-1.5 rounded-full bg-teal-100">
                <div className="h-1.5 rounded-full bg-teal-500" style={{ width: `${Math.min(100, recoveryPct)}%` }} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── ACCIONES RÁPIDAS ────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 no-print">
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-4">
          Acciones Rápidas
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { href: '/produccion/camiones/nuevo', label: 'Registrar Ingreso de Camión', icon: '🚛', color: 'bg-slate-700 hover:bg-slate-800' },
            { href: '/personal/escanear', label: 'Registrar Asistencia', icon: '📲', color: 'bg-emerald-600 hover:bg-emerald-700' },
            { href: '/produccion/nuevo', label: 'Registrar Producción', icon: '🏭', color: 'bg-sky-600 hover:bg-sky-700' },
            { href: '/personal/cuadrillas', label: 'Ver Cuadrillas', icon: '👷', color: 'bg-amber-500 hover:bg-amber-600' },
            { href: '/comercial/transacciones/nueva', label: 'Agregar Transacción', icon: '💰', color: 'bg-teal-600 hover:bg-teal-700' },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-white transition-all ${action.color}`}
            >
              <span className="text-lg">{action.icon}</span>
              {action.label}
            </Link>
          ))}
        </div>
      </div>

      {/* ── NOTA INFORMATIVA ────────────────────────────────── */}
      <div className="flex items-start gap-3 px-4 py-3 bg-sky-50 border border-sky-200 rounded-xl no-print">
        <svg className="h-4 w-4 text-sky-500 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
        <p className="text-sm text-sky-700">
          Sistema configurado correctamente. Los datos estadísticos se actualizan en tiempo real con la información registrada.
        </p>
      </div>
    </div>
  )
}
