import { getSupabaseSession } from '@/lib/supabase-server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import DailyTaskCard from './daily-task-card'
import AssignTaskForm from './assign-task-form'

const ZONE_CONFIG: Record<string, { label: string; bg: string; ring: string; badge: string }> = {
  A: { label: 'Zona A — Roja · Extremo', bg: 'bg-red-50',    ring: 'border-red-400',    badge: 'bg-red-100 text-red-800' },
  B: { label: 'Zona B — Naranja · Medio', bg: 'bg-orange-50', ring: 'border-orange-400', badge: 'bg-orange-100 text-orange-800' },
  C: { label: 'Zona C — Amarilla · Bajo',  bg: 'bg-yellow-50', ring: 'border-yellow-400', badge: 'bg-yellow-100 text-yellow-800' },
}

const STATUS_COLORS: Record<string, string> = {
  PENDIENTE:   'bg-gray-100 text-gray-700',
  EN_PROGRESO: 'bg-blue-100 text-blue-700',
  COMPLETADO:  'bg-green-100 text-green-700',
}

export default async function CuadrillaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { session, supabase } = await getSupabaseSession()
  if (!session) redirect('/login')

  const { data: team, error } = await supabase
    .from('work_teams')
    .select(`
      id, name, zone, isActive,
      supervisor:employees!supervisorId(id, firstName, lastName, position, photoUrl),
      members:team_members(
        id,
        employee:employees!employeeId(id, firstName, lastName, position, photoUrl)
      )
    `)
    .eq('id', id)
    .single()

  if (error || !team) notFound()

  const today = new Date().toISOString().slice(0, 10)

  const { data: todayTask } = await supabase
    .from('daily_tasks')
    .select('id, zone, materialPriority, targetArea, completedArea, status')
    .eq('teamId', id)
    .eq('date', today)
    .maybeSingle()

  const { data: taskHistory } = await supabase
    .from('daily_tasks')
    .select('id, date, zone, materialPriority, targetArea, completedArea, status, notes')
    .eq('teamId', id)
    .neq('date', today)
    .order('date', { ascending: false })
    .limit(30)

  const zoneCfg = ZONE_CONFIG[(team as any).zone] ?? ZONE_CONFIG.C
  const supervisor = (team as any).supervisor
  const members = (team as any).members?.map((m: any) => m.employee).filter(Boolean) ?? []

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link href="/personal/cuadrillas" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700">
          <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver a cuadrillas
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">{(team as any).name}</h1>
          {!(team as any).isActive && (
            <span className="text-sm bg-gray-100 text-gray-500 px-2 py-0.5 rounded">Inactiva</span>
          )}
          <span className={`text-sm font-medium px-2.5 py-0.5 rounded ${zoneCfg.badge}`}>{zoneCfg.label}</span>
        </div>
        {supervisor && (
          <p className="mt-1 text-sm text-gray-500">
            Supervisor: <span className="font-medium text-gray-700">{supervisor.firstName} {supervisor.lastName}</span>
            {supervisor.position && <span className="text-gray-400"> · {supervisor.position}</span>}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tarea de hoy */}
          <div className="bg-white shadow rounded-lg p-5">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Tarea de Hoy</h2>
            {todayTask ? (
              <DailyTaskCard task={todayTask as any} teamId={id} />
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-500">No hay tarea asignada para hoy.</p>
                <AssignTaskForm teamId={id} defaultZone={(team as any).zone} />
              </div>
            )}
          </div>

          {/* Historial de tareas */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">Historial de Tareas</h2>
            </div>
            {!taskHistory || taskHistory.length === 0 ? (
              <p className="px-5 py-8 text-sm text-gray-400 text-center">Sin historial previo.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Fecha', 'Zona', 'Material', 'Completado (m²)', 'Objetivo (m²)', 'Estado'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {(taskHistory as any[]).map(t => (
                      <tr key={t.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {new Date(t.date).toLocaleDateString('es-AR')}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">Zona {t.zone}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{t.materialPriority}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{(t.completedArea ?? 0).toLocaleString('es-AR')}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{t.targetArea ? t.targetArea.toLocaleString('es-AR') : '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded ${STATUS_COLORS[t.status] ?? 'bg-gray-100 text-gray-700'}`}>
                            {t.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar: Miembros */}
        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg p-5">
            <h2 className="text-base font-semibold text-gray-900 mb-4">
              Miembros ({members.length})
            </h2>
            {members.length === 0 ? (
              <p className="text-sm text-gray-400 italic">Sin miembros asignados.</p>
            ) : (
              <div className="space-y-3">
                {members.map((emp: any) => (
                  <div key={emp.id} className="flex items-center gap-3">
                    {emp.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={emp.photoUrl} alt={`${emp.firstName} ${emp.lastName}`}
                        className="h-10 w-10 rounded-full object-cover border border-gray-200 flex-shrink-0" />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-white">{emp.firstName?.[0]}{emp.lastName?.[0]}</span>
                      </div>
                    )}
                    <div className="min-w-0">
                      <Link href={`/personal/${emp.id}`}
                        className="text-sm font-medium text-gray-900 hover:text-blue-600 truncate block">
                        {emp.firstName} {emp.lastName}
                      </Link>
                      <p className="text-xs text-gray-500 truncate">{emp.position}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
