import { getSupabaseSession } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function BuscarInventarioPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const { session, supabase } = await getSupabaseSession()
  if (!session) redirect('/login')

  const query = q?.trim() ?? ''

  let items: any[] = []
  if (query) {
    // Buscar por número de serie, nombre o ID
    const { data: bySerial } = await supabase
      .from('inventory_items')
      .select('id, name, serialNumber, category, status, photoUrl')
      .or(`serialNumber.ilike.%${query}%,name.ilike.%${query}%,id.eq.${query}`)
      .limit(10)

    items = (bySerial as any[]) ?? []

    // Redirigir directo si hay exactamente un resultado
    if (items.length === 1) {
      redirect(`/inventario/${items[0].id}`)
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <Link href="/inventario/escanear" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700">
          <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver al escáner
        </Link>
        <h1 className="mt-2 text-xl font-bold text-gray-900">Resultados de búsqueda</h1>
        {query && <p className="mt-1 text-sm text-gray-500">Código escaneado: <span className="font-mono">{query}</span></p>}
      </div>

      {items.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-8 text-center">
          <p className="text-gray-500 text-sm">No se encontró ningún ítem con ese código.</p>
          <Link href="/inventario" className="mt-3 inline-block text-sm text-green-600 hover:underline">
            Ver inventario completo →
          </Link>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg divide-y divide-gray-100">
          {items.map(item => (
            <Link key={item.id} href={`/inventario/${item.id}`}
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
              <span className="text-2xl">{item.category === 'MAQUINARIA' ? '⚙️' : item.category === 'VEHICULO' ? '🚛' : '📦'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                <p className="text-xs text-gray-400 font-mono">{item.serialNumber}</p>
              </div>
              <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
