import { getSupabaseSession } from '@/lib/supabase-server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import EditEmployeeForm from '../edit-employee-form'

export default async function EditarEmpleadoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { session, supabase } = await getSupabaseSession()

  if (!session) redirect('/login')

  const { data: employee, error } = await supabase
    .from('employees')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !employee) notFound()

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Link href={`/personal/${id}`} className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700">
          <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver al perfil
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">
          Editar: {employee.firstName} {employee.lastName}
        </h1>
      </div>

      <div className="bg-white shadow sm:rounded-lg">
        <EditEmployeeForm employee={employee} />
      </div>
    </div>
  )
}
