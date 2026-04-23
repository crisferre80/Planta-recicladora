import { getSupabaseSession } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

export default async function AlertasPage() {
  const { session } = await getSupabaseSession()

  if (!session) {
    redirect('/login')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Centro de Alertas
        </h1>
        <p className="mt-2 text-gray-600">
          Notificaciones y alertas del sistema
        </p>
      </div>

      {/* Info Banner */}
      <div className="bg-red-50 border-l-4 border-red-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-red-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Módulo en desarrollo
            </h3>
            <p className="mt-2 text-sm text-red-700">
              Este módulo será implementado en la <strong>Fase 5</strong> e incluirá:
            </p>
            <ul className="mt-2 text-sm text-red-700 list-disc list-inside space-y-1">
              <li>Alertas de ausencias excesivas de empleados</li>
              <li>Alertas de equipos cerca de capacidad máxima</li>
              <li>Notificaciones de descuadre de caja</li>
              <li>Alertas de producción por debajo del promedio</li>
              <li>Recordatorios de mantenimiento de equipos</li>
              <li>Sistema de notificaciones push en tiempo real</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Empty State */}
      <div className="bg-white shadow rounded-lg p-12 text-center">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">
          No hay alertas activas
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Las alertas del sistema aparecerán aquí cuando se implementen los módulos operativos.
        </p>
      </div>

      {/* Alert Types Info */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-5">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Tipos de Alertas Planificadas
          </h3>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="p-2 bg-red-100 rounded-lg">
                  <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h4 className="text-sm font-medium text-gray-900">Críticas</h4>
                <p className="text-sm text-gray-500">
                  Requieren atención inmediata (ej: descuadre de caja, equipo fuera de servicio)
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <svg className="h-5 w-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h4 className="text-sm font-medium text-gray-900">Advertencias</h4>
                <p className="text-sm text-gray-500">
                  Situaciones a monitorear (ej: equipo al 85% de capacidad, ausencias frecuentes)
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h4 className="text-sm font-medium text-gray-900">Informativas</h4>
                <p className="text-sm text-gray-500">
                  Notificaciones generales (ej: recordatorios, reportes disponibles)
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
