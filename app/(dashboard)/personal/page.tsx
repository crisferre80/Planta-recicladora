import { getSupabaseSession } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import AttendanceCalendar from './attendance-calendar'
import PrintButton from '@/app/components/PrintButton'

export default async function PersonalPage() {
  const { session, supabase } = await getSupabaseSession()

  if (!session) {
    redirect('/login')
  }

  // Obtener lista de empleados con información de turnos
  const { data: employees, error } = await supabase
    .from('employees')
    .select(`
      *,
      shift_assignments (
        shift:work_shifts (
          name,
          startTime,
          endTime
        )
      )
    `)
    .order('createdAt', { ascending: false })

  if (error) {
    console.error('Error fetching employees:', error)
  }

  let { data: shifts } = await supabase
    .from('work_shifts')
    .select('id, name, startTime, endTime')
    .eq('isActive', true)

  if (!shifts || !shifts.length) {
    const defaultShifts = [
      { name: '08:00 - 12:00', startTime: '08:00:00', endTime: '12:00:00', days: ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES'], isActive: true },
      { name: '15:00 - 19:00', startTime: '15:00:00', endTime: '19:00:00', days: ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES'], isActive: true }
    ]
    await supabase.from('work_shifts').insert(defaultShifts)
    const { data: refreshed } = await supabase
      .from('work_shifts')
      .select('id, name, startTime, endTime')
      .eq('isActive', true)
    shifts = refreshed
  }

  // Formatear estado para mostrar
  const getStatusBadge = (status: string) => {
    const badges = {
      ACTIVO: 'bg-green-100 text-green-800',
      INACTIVO: 'bg-gray-100 text-gray-800',
      SUSPENDIDO: 'bg-yellow-100 text-yellow-800',
      DESPEDIDO: 'bg-red-100 text-red-800'
    }
    return badges[status as keyof typeof badges] || badges.INACTIVO
  }

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div
        className="relative rounded-2xl overflow-hidden min-h-[140px] flex items-end no-print"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 60%, #1d4ed8 100%)' }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&q=65&auto=format&fit=crop"
          alt="" aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-25"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 to-transparent" />
        <div className="relative z-10 p-6 flex items-end justify-between w-full">
          <div>
            <p className="text-sky-400 text-xs font-semibold uppercase tracking-widest mb-1">Recursos Humanos</p>
            <h1 className="text-2xl font-bold text-white">Gestión de Personal</h1>
            <p className="text-slate-300 text-sm mt-1">Empleados, asistencias y turnos de trabajo</p>
          </div>
          <div className="hidden sm:block"><PrintButton /></div>
        </div>
      </div>

      {/* Print header */}
      <div className="print-only hidden print-report-header">
        <div>
          <div className="print-report-title">Informe de Personal — Planta de Reciclado</div>
          <div className="print-report-meta">Generado: {new Date().toLocaleString('es-AR')}</div>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between no-print">
        <div />
        <div className="flex flex-wrap gap-2">
          <Link
            href="/personal/escanear"
            className="inline-flex items-center px-3 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 shadow-sm transition-colors"
          >
            📲 Escanear QR
          </Link>
          <Link
            href="/personal/cuadrillas"
            className="inline-flex items-center px-3 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 shadow-sm transition-colors"
          >
            👷 Cuadrillas
          </Link>
          <Link
            href="/personal/nuevo"
            className="inline-flex items-center px-3 py-2 border border-transparent rounded-xl text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-600 shadow-sm transition-colors"
          >
            + Nuevo
          </Link>
        </div>
      </div>

      <AttendanceCalendar initialShifts={shifts ?? []} />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Total Empleados', value: employees?.length || 0, color: 'bg-slate-700', icon: '👥' },
          { label: 'Activos', value: employees?.filter(e => e.status === 'ACTIVO').length || 0, color: 'bg-emerald-500', icon: '✅' },
          { label: 'Con Turno', value: employees?.filter(e => e.shift_assignments && e.shift_assignments.length > 0).length || 0, color: 'bg-sky-500', icon: '🕐' },
          { label: 'Inactivos', value: employees?.filter(e => e.status !== 'ACTIVO').length || 0, color: 'bg-red-500', icon: '⛔' },
        ].map(stat => (
          <div key={stat.label} className="stat-card p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{stat.label}</p>
                <p className="mt-2 text-3xl font-bold text-slate-800">{stat.value}</p>
              </div>
              <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center text-lg flex-shrink-0`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Employee List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Lista de Empleados</h3>
          <span className="text-xs text-slate-400">{employees?.length || 0} registros</span>
        </div>
        <ul className="divide-y divide-slate-100">
          {employees && employees.length > 0 ? (
            employees.map((employee) => (
              <li key={employee.id}>
                <Link href={`/personal/${employee.id}`} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      {employee.photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={employee.photoUrl} alt={`${employee.firstName} ${employee.lastName}`}
                          className="h-10 w-10 rounded-xl object-cover border-2 border-slate-200" />
                      ) : (
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center">
                          <span className="text-sm font-bold text-white">
                            {employee.firstName?.[0]}{employee.lastName?.[0]}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-800 truncate">
                          {employee.firstName} {employee.lastName}
                        </p>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusBadge(employee.status)}`}>
                            {employee.status}
                          </span>
                          <svg className="h-4 w-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                      <div className="mt-0.5 flex flex-wrap gap-x-4 gap-y-0.5">
                        <p className="text-xs text-slate-500">{employee.position}</p>
                        {employee.email && <p className="text-xs text-slate-400">{employee.email}</p>}
                        {employee.phone && <p className="text-xs text-slate-400">{employee.phone}</p>}
                      </div>
                    </div>
                </Link>
              </li>
            ))
          ) : (
            <li className="px-5 py-12 text-center">
              <p className="text-slate-400 text-sm">No hay empleados registrados.</p>
              <Link
                href="/personal/nuevo"
                className="mt-4 inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl transition-colors"
              >
                + Nuevo Empleado
              </Link>
            </li>
          )}
        </ul>
      </div>
    </div>
  )
}

