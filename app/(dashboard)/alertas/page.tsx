import { getSupabaseSession } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

type AlertSeverity = 'critica' | 'advertencia' | 'informativa'

interface Alert {
  id: string
  severity: AlertSeverity
  title: string
  description: string
  category: string
  timestamp: string
}

const severityConfig: Record<AlertSeverity, { bg: string; border: string; badge: string; icon: string; label: string }> = {
  critica: {
    bg: 'bg-red-50',
    border: 'border-red-400',
    badge: 'bg-red-100 text-red-800',
    icon: 'text-red-500',
    label: 'Crítica',
  },
  advertencia: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-400',
    badge: 'bg-yellow-100 text-yellow-800',
    icon: 'text-yellow-500',
    label: 'Advertencia',
  },
  informativa: {
    bg: 'bg-blue-50',
    border: 'border-blue-400',
    badge: 'bg-blue-100 text-blue-800',
    icon: 'text-blue-500',
    label: 'Informativa',
  },
}

export default async function AlertasPage() {
  const { session, supabase } = await getSupabaseSession()

  if (!session) {
    redirect('/login')
  }

  const alerts: Alert[] = []
  const now = new Date()

  // ── 1. Ausencias excesivas ─────────────────────────────────────────────────
  const thirtyDaysAgo = new Date(now)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: absences } = await supabase
    .from('attendance_records')
    .select('employeeId, employee:employees!employeeId(name)')
    .eq('status', 'AUSENTE')
    .gte('date', thirtyDaysAgo.toISOString().slice(0, 10))

  if (absences && absences.length > 0) {
    const countByEmployee = new Map<string, { name: string; count: number }>()
    for (const rec of absences as any[]) {
      const id = rec.employeeId
      const name = rec.employee?.name ?? 'Empleado'
      const prev = countByEmployee.get(id) ?? { name, count: 0 }
      countByEmployee.set(id, { name, count: prev.count + 1 })
    }
    for (const [, { name, count }] of countByEmployee) {
      if (count >= 3) {
        alerts.push({
          id: `ausencia-${name}`,
          severity: count >= 5 ? 'critica' : 'advertencia',
          title: `Ausencias excesivas: ${name}`,
          description: `${count} ausencias en los últimos 30 días.`,
          category: 'Personal',
          timestamp: now.toISOString(),
        })
      }
    }
  }

  // ── 2. Equipos cerca de capacidad máxima ──────────────────────────────────
  const { data: equipment } = await supabase
    .from('equipment')
    .select('id, name, currentLoad, maxCapacity, status')

  if (equipment) {
    for (const eq of equipment as any[]) {
      if (eq.status === 'FUERA_DE_SERVICIO') {
        alerts.push({
          id: `equipo-fuera-${eq.id}`,
          severity: 'critica',
          title: `Equipo fuera de servicio: ${eq.name}`,
          description: 'El equipo está marcado como fuera de servicio y requiere atención inmediata.',
          category: 'Equipos',
          timestamp: now.toISOString(),
        })
      } else if (eq.maxCapacity && eq.currentLoad) {
        const pct = (eq.currentLoad / eq.maxCapacity) * 100
        if (pct >= 90) {
          alerts.push({
            id: `equipo-cap-${eq.id}`,
            severity: 'critica',
            title: `Equipo al ${Math.round(pct)}% de capacidad: ${eq.name}`,
            description: `Carga actual: ${eq.currentLoad} / ${eq.maxCapacity}. Considere reducir la carga.`,
            category: 'Equipos',
            timestamp: now.toISOString(),
          })
        } else if (pct >= 75) {
          alerts.push({
            id: `equipo-cap-warn-${eq.id}`,
            severity: 'advertencia',
            title: `Equipo al ${Math.round(pct)}% de capacidad: ${eq.name}`,
            description: `Carga actual: ${eq.currentLoad} / ${eq.maxCapacity}. Monitorear de cerca.`,
            category: 'Equipos',
            timestamp: now.toISOString(),
          })
        }
      }
    }
  }

  // ── 3. Descuadre de caja ──────────────────────────────────────────────────
  const { data: cashRegisters } = await supabase
    .from('cash_registers')
    .select('id, name, expectedBalance, actualBalance, closedAt')
    .not('actualBalance', 'is', null)
    .order('closedAt', { ascending: false })
    .limit(10)

  if (cashRegisters) {
    for (const cr of cashRegisters as any[]) {
      const diff = Math.abs((cr.actualBalance ?? 0) - (cr.expectedBalance ?? 0))
      if (diff > 100) {
        alerts.push({
          id: `caja-${cr.id}`,
          severity: diff > 500 ? 'critica' : 'advertencia',
          title: `Descuadre de caja: ${cr.name ?? 'Caja'}`,
          description: `Diferencia de $${diff.toLocaleString('es-AR', { minimumFractionDigits: 2 })} entre saldo esperado y real.`,
          category: 'Comercial',
          timestamp: cr.closedAt ?? now.toISOString(),
        })
      }
    }
  }

  // ── 4. Producción por debajo del promedio ─────────────────────────────────
  const sevenDaysAgo = new Date(now)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)

  const { data: recentProduction } = await supabase
    .from('production_records')
    .select('quantity, date')
    .gte('date', sevenDaysAgo.toISOString().slice(0, 10))
    .lt('date', now.toISOString().slice(0, 10))

  if (recentProduction && recentProduction.length > 1) {
    const byDay = new Map<string, number>()
    for (const rec of recentProduction as any[]) {
      const day = rec.date?.slice(0, 10) ?? ''
      byDay.set(day, (byDay.get(day) ?? 0) + (rec.quantity ?? 0))
    }
    const values = Array.from(byDay.values())
    const avg = values.reduce((a, b) => a + b, 0) / values.length
    const yesterdayKey = yesterday.toISOString().slice(0, 10)
    const yesterdayTotal = byDay.get(yesterdayKey)

    if (yesterdayTotal !== undefined && avg > 0 && yesterdayTotal < avg * 0.7) {
      alerts.push({
        id: 'produccion-baja',
        severity: 'advertencia',
        title: 'Producción por debajo del promedio',
        description: `Ayer se procesaron ${yesterdayTotal.toFixed(1)} kg, un ${Math.round((1 - yesterdayTotal / avg) * 100)}% por debajo del promedio de los últimos 7 días (${avg.toFixed(1)} kg).`,
        category: 'Producción',
        timestamp: now.toISOString(),
      })
    }
  }

  // ── 5. Mantenimiento de equipos ───────────────────────────────────────────
  const { data: maintenanceEquipment } = await supabase
    .from('equipment')
    .select('id, name, lastMaintenanceDate, maintenanceIntervalDays')
    .not('maintenanceIntervalDays', 'is', null)

  if (maintenanceEquipment) {
    for (const eq of maintenanceEquipment as any[]) {
      if (!eq.lastMaintenanceDate || !eq.maintenanceIntervalDays) continue
      const lastDate = new Date(eq.lastMaintenanceDate)
      const nextDate = new Date(lastDate)
      nextDate.setDate(nextDate.getDate() + eq.maintenanceIntervalDays)
      const daysUntil = Math.ceil((nextDate.getTime() - now.getTime()) / 86400000)

      if (daysUntil <= 0) {
        alerts.push({
          id: `mant-vencido-${eq.id}`,
          severity: 'critica',
          title: `Mantenimiento vencido: ${eq.name}`,
          description: `El mantenimiento venció hace ${Math.abs(daysUntil)} día(s). Programar inmediatamente.`,
          category: 'Equipos',
          timestamp: now.toISOString(),
        })
      } else if (daysUntil <= 7) {
        alerts.push({
          id: `mant-proximo-${eq.id}`,
          severity: 'informativa',
          title: `Mantenimiento próximo: ${eq.name}`,
          description: `El próximo mantenimiento es en ${daysUntil} día(s) (${nextDate.toLocaleDateString('es-AR')}).`,
          category: 'Equipos',
          timestamp: now.toISOString(),
        })
      }
    }
  }

  // ── 6. Ingreso diario de camiones supera 23 ton ───────────────────────────
  const todayISO = now.toISOString().slice(0, 10)
  const { data: todayTrucks } = await supabase
    .from('truck_entries')
    .select('netWeight')
    .gte('entryTime', `${todayISO}T00:00:00`)
    .lt('entryTime', `${todayISO}T23:59:59`)

  if (todayTrucks && todayTrucks.length > 0) {
    const totalNetKg = (todayTrucks as any[]).reduce((sum, r) => sum + (r.netWeight ?? 0), 0)
    if (totalNetKg > 23000) {
      alerts.push({
        id: 'camiones-limite',
        severity: 'critica',
        title: 'Ingreso diario supera límite de 23 Tn',
        description: `Se ingresaron ${(totalNetKg / 1000).toFixed(2)} Tn hoy (${(todayTrucks as any[]).length} camiones). El límite operativo es 23 Tn.`,
        category: 'Producción',
        timestamp: now.toISOString(),
      })
    }
  }

  // ── 7. Zona A activa sin tarea completada ─────────────────────────────────
  const { data: zonaATasks } = await supabase
    .from('daily_tasks')
    .select('id, status')
    .eq('zone', 'A')
    .eq('date', todayISO)
    .neq('status', 'COMPLETADO')

  if (zonaATasks && zonaATasks.length > 0) {
    alerts.push({
      id: 'zona-roja-activa',
      severity: 'critica',
      title: 'Zona Roja activa — verificar seguridad peatonal',
      description: `Hay ${zonaATasks.length} tarea(s) sin completar en Zona A hoy. Esta zona requiere maquinaria especial y control de tránsito peatonal.`,
      category: 'Seguridad',
      timestamp: now.toISOString(),
    })
  }

  // ── 8. Cuadrillas activas sin tarea asignada hoy ──────────────────────────
  const { data: activeTeams } = await supabase
    .from('work_teams')
    .select('id, name')
    .eq('isActive', true)

  if (activeTeams && activeTeams.length > 0) {
    const { data: todayTeamIds } = await supabase
      .from('daily_tasks')
      .select('teamId')
      .eq('date', todayISO)

    const assignedIds = new Set((todayTeamIds as any[] ?? []).map((r: any) => r.teamId))
    for (const team of activeTeams as any[]) {
      if (!assignedIds.has(team.id)) {
        alerts.push({
          id: `cuadrilla-sin-tarea-${team.id}`,
          severity: 'informativa',
          title: `Cuadrilla sin tarea asignada: ${team.name}`,
          description: `La cuadrilla "${team.name}" está activa pero no tiene tarea registrada para hoy.`,
          category: 'Personal',
          timestamp: now.toISOString(),
        })
      }
    }
  }

  // ── Ordenar: críticas primero ──────────────────────────────────────────────
  const order: Record<AlertSeverity, number> = { critica: 0, advertencia: 1, informativa: 2 }
  alerts.sort((a, b) => order[a.severity] - order[b.severity])

  const counts = {
    critica: alerts.filter(a => a.severity === 'critica').length,
    advertencia: alerts.filter(a => a.severity === 'advertencia').length,
    informativa: alerts.filter(a => a.severity === 'informativa').length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Centro de Alertas</h1>
          <p className="mt-1 text-gray-600 text-sm sm:mt-2">Notificaciones y alertas del sistema en tiempo real</p>
        </div>
        <div className="text-xs text-gray-400 sm:text-sm sm:text-gray-500 sm:flex-shrink-0">
          Actualizado: {now.toLocaleString('es-AR')}
        </div>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="bg-white shadow rounded-lg p-4 flex items-center space-x-4">
          <div className="flex-shrink-0 p-3 bg-red-100 rounded-full">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{counts.critica}</p>
            <p className="text-sm text-gray-500">Críticas</p>
          </div>
        </div>
        <div className="bg-white shadow rounded-lg p-4 flex items-center space-x-4">
          <div className="flex-shrink-0 p-3 bg-yellow-100 rounded-full">
            <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{counts.advertencia}</p>
            <p className="text-sm text-gray-500">Advertencias</p>
          </div>
        </div>
        <div className="bg-white shadow rounded-lg p-4 flex items-center space-x-4">
          <div className="flex-shrink-0 p-3 bg-blue-100 rounded-full">
            <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{counts.informativa}</p>
            <p className="text-sm text-gray-500">Informativas</p>
          </div>
        </div>
      </div>

      {/* Lista de alertas */}
      {alerts.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Todo en orden</h3>
          <p className="mt-1 text-sm text-gray-500">No hay alertas activas en este momento.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map(alert => {
            const cfg = severityConfig[alert.severity]
            return (
              <div key={alert.id} className={`${cfg.bg} border-l-4 ${cfg.border} rounded-lg p-4 shadow-sm`}>
                <div className="flex items-start space-x-3">
                  <svg className={`mt-0.5 h-5 w-5 flex-shrink-0 ${cfg.icon}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                      <p className="text-sm font-semibold text-gray-900">{alert.title}</p>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cfg.badge}`}>
                        {cfg.label}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                        {alert.category}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{alert.description}</p>
                    <p className="mt-1 text-xs text-gray-400">
                      {new Date(alert.timestamp).toLocaleString('es-AR')}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
