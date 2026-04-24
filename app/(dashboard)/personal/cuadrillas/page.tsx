import { getSupabaseSession } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

const ZONE_CONFIG = {
  A: { label: 'Zona A', subtitle: 'Roja · Núcleo · Riesgo Extremo', totalArea: 19907.9, phase: 3, ring: 'border-red-400', bg: 'bg-red-50', badge: 'bg-red-100 text-red-800', bar: 'bg-red-500' },
  B: { label: 'Zona B', subtitle: 'Naranja · Intermedia · Riesgo Medio', totalArea: 20216.9, phase: 2, ring: 'border-orange-400', bg: 'bg-orange-50', badge: 'bg-orange-100 text-orange-800', bar: 'bg-orange-500' },
  C: { label: 'Zona C', subtitle: 'Amarilla · Perimetral · Riesgo Bajo', totalArea: 34894.9, phase: 1, ring: 'border-yellow-400', bg: 'bg-yellow-50', badge: 'bg-yellow-100 text-yellow-800', bar: 'bg-yellow-500' },
}

const CRONOGRAMA = [
  { dia: 'Lun / Mar', material: 'Plásticos (bolsas y botellas)', maquinaria: 'Prensa / Compactadora al máximo' },
  { dia: 'Miércoles', material: 'Cartón y Pallets', maquinaria: 'Traslado de fardos · Despacho camiones' },
  { dia: 'Jueves',    material: 'Metales · Aluminio · Chatarra', maquinaria: 'Maquinaria de carga y traslado' },
  { dia: 'Viernes',   material: 'Electrónicos · Caucho', maquinaria: 'Carga y acopio Zona C (seca)' },
  { dia: 'Sábado',    material: 'Mantenimiento y Drenaje', maquinaria: 'Revisión bombas (Zona A) · Limpieza prensa' },
]

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  PENDIENTE:    { label: 'Pendiente',    color: 'bg-gray-100 text-gray-700' },
  EN_PROGRESO:  { label: 'En progreso',  color: 'bg-blue-100 text-blue-700' },
  COMPLETADO:   { label: 'Completado',   color: 'bg-green-100 text-green-700' },
}

export default async function CuadrillasPage() {
  const { session, supabase } = await getSupabaseSession()
  if (!session) redirect('/login')

  const today = new Date().toISOString().slice(0, 10)

  const { data: teams } = await supabase
    .from('work_teams')
    .select(`
      id, name, zone, isActive,
      supervisor:employees!supervisorId(firstName, lastName, photoUrl),
      members:team_members(
        employee:employees!employeeId(id, firstName, lastName, photoUrl)
      )
    `)
    .order('name')

  const { data: todayTasks } = await supabase
    .from('daily_tasks')
    .select('id, teamId, zone, materialPriority, targetArea, completedArea, status')
    .eq('date', today)

  const taskByTeam = new Map<string, any>()
  if (todayTasks) {
    for (const t of todayTasks) taskByTeam.set(t.teamId, t)
  }

  // Acumular m² limpiados por zona (histórico total)
  const { data: allProgress } = await supabase
    .from('zone_progress')
    .select('zone, cleanedArea')

  const cleanedByZone: Record<string, number> = { A: 0, B: 0, C: 0 }
  if (allProgress) {
    for (const p of allProgress as any[]) {
      if (p.zone in cleanedByZone) cleanedByZone[p.zone] += p.cleanedArea ?? 0
    }
  }

  const todayDow = new Date().toLocaleDateString('es-AR', { weekday: 'long' })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cuadrillas de Trabajo</h1>
          <p className="mt-1 text-gray-600">Gestión de equipos, zonas y tareas diarias</p>
        </div>
        <Link href="/personal/cuadrillas/nuevo"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
          <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nueva Cuadrilla
        </Link>
      </div>

      {/* Progreso de zonas */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {(['C', 'B', 'A'] as const).map(zone => {
          const cfg = ZONE_CONFIG[zone]
          const cleaned = cleanedByZone[zone]
          const pct = Math.min((cleaned / cfg.totalArea) * 100, 100)
          return (
            <div key={zone} className={`${cfg.bg} border-2 ${cfg.ring} rounded-lg p-4`}>
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-gray-900">{cfg.label}</p>
                  <p className="text-xs text-gray-600 mt-0.5">{cfg.subtitle}</p>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded ${cfg.badge}`}>Fase {cfg.phase}</span>
              </div>
              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>{cleaned.toLocaleString('es-AR', { maximumFractionDigits: 0 })} m² limpiados</span>
                  <span>{pct.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-white bg-opacity-60 rounded-full h-2">
                  <div className={`h-2 rounded-full ${cfg.bar}`} style={{ width: `${pct}%` }} />
                </div>
                <p className="text-xs text-gray-500 mt-1">{cfg.totalArea.toLocaleString('es-AR')} m² totales</p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Cuadrillas */}
        <div className="lg:col-span-2 space-y-4">
          {!teams || teams.length === 0 ? (
            <div className="bg-white shadow rounded-lg p-12 text-center">
              <p className="text-gray-500 text-sm">No hay cuadrillas configuradas.</p>
              <Link href="/personal/cuadrillas/nuevo" className="mt-3 inline-flex text-sm text-blue-600 hover:underline">
                Crear primera cuadrilla →
              </Link>
            </div>
          ) : (
            (teams as any[]).map(team => {
              const task = taskByTeam.get(team.id)
              const members = team.members?.map((m: any) => m.employee).filter(Boolean) ?? []
              const supervisor = team.supervisor
              const zoneCfg = ZONE_CONFIG[team.zone as keyof typeof ZONE_CONFIG]

              return (
                <div key={team.id} className={`bg-white shadow rounded-lg overflow-hidden border-l-4 ${zoneCfg?.ring ?? 'border-gray-300'}`}>
                  <div className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold text-gray-900">{team.name}</h3>
                          {!team.isActive && (
                            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">Inactiva</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          {zoneCfg?.label} — {zoneCfg?.subtitle}
                        </p>
                        {supervisor && (
                          <p className="text-sm text-gray-600 mt-1">
                            Supervisor: <span className="font-medium">{supervisor.firstName} {supervisor.lastName}</span>
                          </p>
                        )}
                      </div>
                      <Link href={`/personal/cuadrillas/${team.id}`}
                        className="text-sm text-blue-600 hover:underline flex-shrink-0">
                        Ver detalle →
                      </Link>
                    </div>

                    {/* Miembros */}
                    <div className="mt-4">
                      <p className="text-xs font-medium text-gray-500 mb-2">MIEMBROS ({members.length})</p>
                      <div className="flex flex-wrap gap-2">
                        {members.map((emp: any) => (
                          <div key={emp.id} className="flex items-center gap-1.5">
                            {emp.photoUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={emp.photoUrl} alt={`${emp.firstName} ${emp.lastName}`}
                                className="h-7 w-7 rounded-full object-cover border border-gray-200" />
                            ) : (
                              <div className="h-7 w-7 rounded-full bg-blue-500 flex items-center justify-center">
                                <span className="text-xs font-bold text-white">
                                  {emp.firstName?.[0]}{emp.lastName?.[0]}
                                </span>
                              </div>
                            )}
                            <span className="text-xs text-gray-600">{emp.firstName}</span>
                          </div>
                        ))}
                        {members.length === 0 && (
                          <span className="text-xs text-gray-400 italic">Sin miembros asignados</span>
                        )}
                      </div>
                    </div>

                    {/* Tarea de hoy */}
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-xs font-medium text-gray-500 mb-2">TAREA DE HOY</p>
                      {task ? (
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-800">{task.materialPriority} — Zona {task.zone}</p>
                            {task.targetArea && (
                              <p className="text-xs text-gray-500">
                                {task.completedArea.toLocaleString('es-AR')} / {task.targetArea.toLocaleString('es-AR')} m²
                              </p>
                            )}
                          </div>
                          <span className={`text-xs font-semibold px-2 py-1 rounded ${STATUS_CONFIG[task.status]?.color ?? 'bg-gray-100 text-gray-700'}`}>
                            {STATUS_CONFIG[task.status]?.label ?? task.status}
                          </span>
                        </div>
                      ) : (
                        <Link href={`/personal/cuadrillas/${team.id}`}
                          className="text-xs text-blue-600 hover:underline">
                          + Asignar tarea para hoy
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Cronograma semanal */}
        <div className="bg-white shadow rounded-lg p-5 h-fit">
          <h3 className="text-base font-semibold text-gray-900 mb-1">Cronograma Semanal</h3>
          <p className="text-xs text-gray-500 mb-4">Cronograma de Maquinaria — Hoy: {todayDow}</p>
          <div className="space-y-3">
            {CRONOGRAMA.map((row, i) => (
              <div key={i} className="border border-gray-100 rounded-lg p-3">
                <p className="text-xs font-bold text-gray-700 uppercase">{row.dia}</p>
                <p className="text-sm font-medium text-gray-900 mt-0.5">{row.material}</p>
                <p className="text-xs text-gray-500 mt-1">{row.maquinaria}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
