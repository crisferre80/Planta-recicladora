'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/db'

const DEFAULT_SHIFTS = [
  { name: '08:00 - 12:00', startTime: '08:00:00', endTime: '12:00:00' },
  { name: '15:00 - 19:00', startTime: '15:00:00', endTime: '19:00:00' }
]

const STATUS_OPTIONS = ['PRESENTE', 'AUSENTE', 'TARDE', 'JUSTIFICADO', 'FALTA']

const formatDate = (date: string) => {
  const [year, month, day] = date.split('-')
  return `${year}-${month}-${day} 00:00:00`
}

const todayDate = new Date().toISOString().slice(0, 10)

interface AttendanceCalendarProps {
  initialShifts: Array<{ id: string; name: string; startTime: string; endTime: string }>
}

export default function AttendanceCalendar({ initialShifts }: AttendanceCalendarProps) {
  const [selectedDate, setSelectedDate] = useState(todayDate)
  const [employees, setEmployees] = useState<any[]>([])
  const [shifts, setShifts] = useState<any[]>(initialShifts)
  const [attendance, setAttendance] = useState<Record<string, string>>({})
  const [assignedShifts, setAssignedShifts] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const load = async () => {
      const { data: employeeData } = await supabase
        .from('employees')
        .select('id, firstName, lastName, status, photoUrl')
        .eq('status', 'ACTIVO')
        .order('firstName', { ascending: true })

      if (employeeData) setEmployees(employeeData)
    }

    load()
  }, [])

  useEffect(() => {
    const loadAttendance = async () => {
      if (!selectedDate) return
      const dayStart = formatDate(selectedDate)
      const dayEnd = `${selectedDate} 23:59:59`
      const { data } = await supabase
        .from('attendances')
        .select('employeeId, status')
        .gte('date', dayStart)
        .lte('date', dayEnd)

      if (data) {
        const attendanceMap: Record<string, string> = {}
        data.forEach((item: any) => {
          attendanceMap[item.employeeId] = item.status
        })
        setAttendance(attendanceMap)
      }
    }

    loadAttendance()
  }, [selectedDate])

  const handleAttendanceChange = (employeeId: string, value: string) => {
    setAttendance((prev) => ({ ...prev, [employeeId]: value }))
  }

  const handleShiftChange = (employeeId: string, shiftId: string) => {
    setAssignedShifts((prev) => ({ ...prev, [employeeId]: shiftId }))
  }

  const rotateShifts = () => {
    const activeEmployees = employees.filter((emp) => emp.status === 'ACTIVO')
    const nextAssigned: Record<string, string> = {}
    activeEmployees.forEach((employee, index) => {
      const shift = shifts[index % shifts.length]
      if (shift) nextAssigned[employee.id] = shift.id
    })
    setAssignedShifts(nextAssigned)
    setMessage('Turnos rotativos asignados automáticamente')
  }

  const saveAttendance = async () => {
    setLoading(true)
    setMessage('')

    const attendancePayload = employees.map((employee) => {
      const status = attendance[employee.id] || 'FALTA'
      return {
        employeeId: employee.id,
        date: formatDate(selectedDate),
        status,
        notes: status === 'PRESENTE' ? 'Asistencia registrada' : null
      }
    })

    const shiftPayload = employees
      .map((employee) => {
        const shiftId = assignedShifts[employee.id]
        const shift = shifts.find((item) => item.id === shiftId)
        if (!shift) return null
        return {
          employeeId: employee.id,
          shiftId,
          startDate: `${selectedDate} ${shift.startTime}`,
          endDate: `${selectedDate} ${shift.endTime}`
        }
      })
      .filter(Boolean)

    const dateStart = `${selectedDate} 00:00:00`
    const dateEnd = `${selectedDate} 23:59:59`
    const { error: deleteError } = await supabase
      .from('attendances')
      .delete()
      .gte('date', dateStart)
      .lte('date', dateEnd)

    if (deleteError) {
      setMessage(`Error limpiando asistencias previas: ${deleteError.message}`)
      setLoading(false)
      return
    }

    const { error: attendanceError } = await supabase
      .from('attendances')
      .insert(attendancePayload)

    if (attendanceError) {
      setMessage(`Error guardando asistencias: ${attendanceError.message}`)
      setLoading(false)
      return
    }

    if (shiftPayload.length > 0) {
      const { error: shiftError } = await supabase
        .from('shift_assignments')
        .delete()
        .in('employeeId', employees.map((employee) => employee.id))
        .gte('startDate', dateStart)
        .lte('startDate', dateEnd)

      if (shiftError) {
        console.warn('Error limpiando turnos previos:', shiftError.message)
      }

      const { error: newShiftError } = await supabase
        .from('shift_assignments')
        .insert(shiftPayload)

      if (newShiftError) {
        setMessage(`Error guardando turnos: ${newShiftError.message}`)
        setLoading(false)
        return
      }
    }

    setMessage('Asistencias y turnos guardados correctamente')
    setLoading(false)
  }

  const summary = useMemo(() => {
    const counts = { PRESENTE: 0, AUSENTE: 0, TARDE: 0, JUSTIFICADO: 0, FALTA: 0 }
    Object.values(attendance).forEach((status) => {
      if (counts[status as keyof typeof counts] !== undefined) {
        counts[status as keyof typeof counts] += 1
      }
    })
    return counts
  }, [attendance])

  return (
    <div className="bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-lg font-medium leading-6 text-gray-900">Calendario de Asistencias</h2>
            <p className="mt-1 text-sm text-gray-500">
              Registra empleados presentes, ausentes y turnos rotativos por día.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            <div>
              <label htmlFor="attendanceDate" className="block text-sm font-medium text-gray-700">
                Día
              </label>
              <input
                id="attendanceDate"
                type="date"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <button
                type="button"
                onClick={rotateShifts}
                className="mt-6 inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
              >
                Rotar Turnos
              </button>
            </div>
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-sm font-medium text-gray-500">Resumen</p>
              <p className="mt-2 text-xs text-gray-600">Presente: {summary.PRESENTE}</p>
              <p className="text-xs text-gray-600">Ausente: {summary.AUSENTE}</p>
              <p className="text-xs text-gray-600">Tarde: {summary.TARDE}</p>
              <p className="text-xs text-gray-600">Falta: {summary.FALTA}</p>
            </div>
          </div>
        </div>
      </div>
      <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
        {message && (
          <div className="mb-4 rounded-md bg-green-50 p-4 text-sm text-green-700">
            {message}
          </div>
        )}
        <div className="grid gap-4">
          {employees.map((employee) => (
            <div key={employee.id} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                  {employee.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={employee.photoUrl} alt={`${employee.firstName} ${employee.lastName}`}
                      className="h-10 w-10 rounded-full object-cover border border-gray-200 flex-shrink-0" />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-white">
                        {employee.firstName?.[0]}{employee.lastName?.[0]}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-gray-900">{employee.firstName} {employee.lastName}</p>
                    <p className="text-sm text-gray-500">{employee.status}</p>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700">Asistencia</label>
                    <select
                      value={attendance[employee.id] || 'FALTA'}
                      onChange={(event) => handleAttendanceChange(employee.id, event.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 bg-white py-2 px-3 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700">Turno</label>
                    <select
                      value={assignedShifts[employee.id] || ''}
                      onChange={(event) => handleShiftChange(employee.id, event.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 bg-white py-2 px-3 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                    >
                      <option value="">Sin turno</option>
                      {shifts.map((shift) => (
                        <option key={shift.id} value={shift.id}>{shift.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            disabled={loading}
            onClick={saveAttendance}
            className="inline-flex items-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Guardando...' : 'Guardar asistencia'}
          </button>
        </div>
      </div>
    </div>
  )
}
