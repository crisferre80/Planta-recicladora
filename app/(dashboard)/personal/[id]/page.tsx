import { getSupabaseSession } from '@/lib/supabase-server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import EmployeeCredential from './employee-credential'

export default async function EmployeeProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { session, supabase } = await getSupabaseSession()

  if (!session) redirect('/login')

  const { data: employee, error } = await supabase
    .from('employees')
    .select(`
      *,
      shift_assignments (
        shift:work_shifts ( name, startTime, endTime )
      )
    `)
    .eq('id', id)
    .single()

  if (error || !employee) notFound()

  // Últimas 10 asistencias
  const { data: attendanceRecords } = await supabase
    .from('attendance_records')
    .select('id, date, status, checkIn, checkOut, notes')
    .eq('employeeId', id)
    .order('date', { ascending: false })
    .limit(10)

  const statusColors: Record<string, string> = {
    ACTIVO: 'bg-green-100 text-green-800',
    INACTIVO: 'bg-gray-100 text-gray-800',
    SUSPENDIDO: 'bg-yellow-100 text-yellow-800',
    DESPEDIDO: 'bg-red-100 text-red-800',
  }

  const attendanceColors: Record<string, string> = {
    PRESENTE: 'bg-green-100 text-green-700',
    AUSENTE: 'bg-red-100 text-red-700',
    TARDANZA: 'bg-yellow-100 text-yellow-700',
    LICENCIA: 'bg-blue-100 text-blue-700',
  }

  const initials = `${employee.firstName?.[0] ?? ''}${employee.lastName?.[0] ?? ''}`.toUpperCase()

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back */}
      <div>
        <Link href="/personal" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700">
          <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver a Personal
        </Link>
      </div>

      {/* Header con foto */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-blue-600 to-blue-800" />
        <div className="px-6 pb-6">
          <div className="-mt-12 flex items-end justify-between">
            <div className="flex items-end space-x-4">
              {employee.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={employee.photoUrl}
                  alt={`${employee.firstName} ${employee.lastName}`}
                  className="h-24 w-24 rounded-full ring-4 ring-white object-cover bg-gray-100"
                />
              ) : (
                <div className="h-24 w-24 rounded-full ring-4 ring-white bg-blue-600 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">{initials}</span>
                </div>
              )}
              <div className="pb-2">
                <h1 className="text-2xl font-bold text-gray-900">
                  {employee.firstName} {employee.lastName}
                </h1>
                <p className="text-sm text-gray-500">{employee.position} · {employee.department}</p>
              </div>
            </div>
            <div className="pb-2 flex items-center space-x-3">
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusColors[employee.status] ?? 'bg-gray-100 text-gray-800'}`}>
                {employee.status}
              </span>
              <Link
                href={`/personal/${id}/editar`}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Editar
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Datos del empleado */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Información Personal</h2>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[
                { label: 'DNI / Documento', value: employee.dni },
                { label: 'Teléfono', value: employee.phone },
                { label: 'Email', value: employee.email },
                { label: 'Dirección', value: employee.address },
                { label: 'Fecha de ingreso', value: employee.hireDate ? new Date(employee.hireDate).toLocaleDateString('es-AR') : '-' },
                { label: 'Salario', value: employee.salary ? `$${Number(employee.salary).toLocaleString('es-AR', { minimumFractionDigits: 2 })}` : '-' },
                { label: 'Turno', value: employee.shift_assignments?.[0]?.shift?.name ?? 'Sin turno asignado' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</dt>
                  <dd className="mt-1 text-sm text-gray-900">{value ?? '-'}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Historial de asistencia */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Últimas Asistencias</h2>
            {attendanceRecords && attendanceRecords.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Entrada</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Salida</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {attendanceRecords.map((rec: any) => (
                      <tr key={rec.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2 text-sm text-gray-900">
                          {rec.date ? new Date(rec.date).toLocaleDateString('es-AR') : '-'}
                        </td>
                        <td className="px-3 py-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${attendanceColors[rec.status] ?? 'bg-gray-100 text-gray-700'}`}>
                            {rec.status}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-500">{rec.checkIn ?? '-'}</td>
                        <td className="px-3 py-2 text-sm text-gray-500">{rec.checkOut ?? '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No hay registros de asistencia.</p>
            )}
          </div>
        </div>

        {/* Credencial con QR */}
        <div className="space-y-4">
          <EmployeeCredential
            employeeId={employee.id}
            firstName={employee.firstName}
            lastName={employee.lastName}
            position={employee.position}
            department={employee.department}
            photoUrl={employee.photoUrl ?? null}
          />
        </div>
      </div>
    </div>
  )
}
