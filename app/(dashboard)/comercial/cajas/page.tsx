import { getSupabaseSession } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function CajasPage() {
  const { session, supabase } = await getSupabaseSession()

  if (!session) {
    redirect('/login')
  }

  // Obtener todas las cajas registradoras
  const { data: cashRegisters, error } = await supabase
    .from('cash_registers')
    .select(`
      *,
      openedByUser:users!openedBy(name),
      closedByUser:users!closedBy(name)
    `)
    .order('openedAt', { ascending: false })

  if (error) {
    console.error('Error fetching cash registers:', error)
  }

  // Separar cajas activas e inactivas
  const activeCashRegisters = cashRegisters?.filter(c => c.isActive) || []
  const closedCashRegisters = cashRegisters?.filter(c => !c.isActive) || []

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Cajas Registradoras
          </h1>
          <p className="mt-2 text-gray-600">
            Gestión de cajas y movimientos de efectivo
          </p>
        </div>
        <Link
          href="/comercial/cajas/nueva"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Abrir Nueva Caja
        </Link>
      </div>

      {/* Cajas Activas */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 bg-green-50 border-b border-green-200">
          <h3 className="text-lg leading-6 font-medium text-green-900">
            Cajas Activas ({activeCashRegisters.length})
          </h3>
        </div>
        <ul className="divide-y divide-gray-200">
          {activeCashRegisters.length > 0 ? (
            activeCashRegisters.map((caja: any) => (
              <li key={caja.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <h4 className="text-lg font-medium text-gray-900">{caja.name}</h4>
                      <span className="ml-3 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Abierta
                      </span>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-4 text-sm text-gray-500">
                      <div>
                        <p className="font-medium text-gray-700">Apertura</p>
                        <p>{new Date(caja.openedAt).toLocaleString('es-AR')}</p>
                        <p className="mt-1">Por: {caja.openedByUser?.name || 'Desconocido'}</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-700">Saldos</p>
                        <p>Inicial: ${caja.openingBalance.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</p>
                        <p className="font-medium text-blue-600">
                          Actual: ${caja.currentBalance.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="ml-6">
                    <Link
                      href={`/comercial/cajas/${caja.id}/cerrar`}
                      className="inline-flex items-center px-3 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50"
                    >
                      Cerrar Caja
                    </Link>
                  </div>
                </div>
              </li>
            ))
          ) : (
            <li className="px-4 py-12 sm:px-6 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay cajas abiertas</h3>
              <p className="mt-1 text-sm text-gray-500">Comienza abriendo una nueva caja registradora.</p>
            </li>
          )}
        </ul>
      </div>

      {/* Cajas Cerradas */}
      {closedCashRegisters.length > 0 && (
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Cajas Cerradas ({closedCashRegisters.length})
            </h3>
          </div>
          <ul className="divide-y divide-gray-200">
            {closedCashRegisters.slice(0, 10).map((caja: any) => (
              <li key={caja.id} className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <h4 className="text-base font-medium text-gray-900">{caja.name}</h4>
                      <span className="ml-3 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                        Cerrada
                      </span>
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-4 text-sm text-gray-500">
                      <div>
                        <p className="font-medium text-gray-700">Apertura</p>
                        <p>{new Date(caja.openedAt).toLocaleDateString('es-AR')}</p>
                        <p className="text-xs">{caja.openedByUser?.name || 'Desconocido'}</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-700">Cierre</p>
                        <p>{caja.closedAt ? new Date(caja.closedAt).toLocaleDateString('es-AR') : '-'}</p>
                        <p className="text-xs">{caja.closedByUser?.name || '-'}</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-700">Saldo Final</p>
                        <p className="text-gray-900">
                          ${caja.currentBalance.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
