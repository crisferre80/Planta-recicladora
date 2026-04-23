import { getSupabaseSession } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function ComercialPage() {
  const { session, supabase } = await getSupabaseSession()

  if (!session) {
    redirect('/login')
  }

  // Obtener cajas registradoras activas
  const { data: activeCashRegisters, error: cashError } = await supabase
    .from('cash_registers')
    .select('*, openedByUser:users!openedBy(name)')
    .eq('isActive', true)
    .order('openedAt', { ascending: false })

  if (cashError) {
    console.error('Error fetching cash registers:', cashError)
  }

  // Obtener transacciones del día
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const { data: todayTransactions } = await supabase
    .from('transactions')
    .select('*')
    .gte('date', today.toISOString())
    .lt('date', tomorrow.toISOString())

  // Calcular totales del día
  const ingresos = todayTransactions?.filter(t => t.type === 'INGRESO').reduce((sum, t) => sum + t.amount, 0) || 0
  const egresos = todayTransactions?.filter(t => t.type === 'EGRESO').reduce((sum, t) => sum + t.amount, 0) || 0
  const balance = ingresos - egresos

  // Obtener total de cajas activas
  const totalCajasActivas = activeCashRegisters?.length || 0
  const saldoCajasActivas = activeCashRegisters?.reduce((sum, caja) => sum + caja.currentBalance, 0) || 0

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Sistema Comercial
          </h1>
          <p className="mt-2 text-gray-600">
            Gestión financiera y contable
          </p>
        </div>
        <div className="flex space-x-3">
          <Link
            href="/comercial/cajas"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            Cajas
          </Link>
          <Link
            href="/comercial/transacciones/nueva"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nueva Transacción
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="rounded-md bg-green-500 p-3">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Ingresos Hoy</dt>
                  <dd className="text-lg font-medium text-gray-900">${ingresos.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="rounded-md bg-red-500 p-3">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Egresos Hoy</dt>
                  <dd className="text-lg font-medium text-gray-900">${egresos.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className={`rounded-md p-3 ${balance >= 0 ? 'bg-blue-500' : 'bg-orange-500'}`}>
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Balance Hoy</dt>
                  <dd className={`text-lg font-medium ${balance >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                    ${balance.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="rounded-md bg-purple-500 p-3">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Cajas Activas</dt>
                  <dd className="text-lg font-medium text-gray-900">{totalCajasActivas}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cajas Activas */}
      {activeCashRegisters && activeCashRegisters.length > 0 && (
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Cajas Registradoras Activas
            </h3>
          </div>
          <ul className="divide-y divide-gray-200">
            {activeCashRegisters.map((caja: any) => (
              <li key={caja.id} className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-600">{caja.name}</p>
                    <p className="text-sm text-gray-500">
                      Abierta por: {caja.openedByUser?.name || 'Desconocido'} • {new Date(caja.openedAt).toLocaleString('es-AR')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Saldo Actual</p>
                    <p className="text-lg font-medium text-gray-900">
                      ${caja.currentBalance.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Transacciones Recientes */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Transacciones de Hoy
          </h3>
          <Link
            href="/comercial/transacciones"
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Ver todas
          </Link>
        </div>
        <ul className="divide-y divide-gray-200">
          {todayTransactions && todayTransactions.length > 0 ? (
            todayTransactions.slice(0, 10).map((transaction: any) => (
              <li key={transaction.id} className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        transaction.type === 'INGRESO' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {transaction.type}
                      </span>
                      <span className="ml-3 text-sm font-medium text-gray-900">
                        {transaction.description}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      {transaction.paymentMethod} • {new Date(transaction.date).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className={`text-lg font-medium ${
                    transaction.type === 'INGRESO' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.type === 'INGRESO' ? '+' : '-'}${transaction.amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </li>
            ))
          ) : (
            <li className="px-4 py-12 sm:px-6 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Sin transacciones</h3>
              <p className="mt-1 text-sm text-gray-500">Comienza registrando una transacción.</p>
            </li>
          )}
        </ul>
      </div>
    </div>
  )
}
