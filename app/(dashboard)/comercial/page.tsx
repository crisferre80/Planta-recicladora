import { getSupabaseSession } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import PrintButton from '@/app/components/PrintButton'

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
      {/* Hero */}
      <div
        className="relative rounded-2xl overflow-hidden min-h-[140px] flex items-end no-print"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #14532d 60%, #16a34a 100%)' }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1200&q=65&auto=format&fit=crop"
          alt="" aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 to-transparent" />
        <div className="relative z-10 p-6 flex items-end justify-between w-full">
          <div>
            <p className="text-emerald-400 text-xs font-semibold uppercase tracking-widest mb-1">Área Financiera</p>
            <h1 className="text-2xl font-bold text-white">Sistema Comercial</h1>
            <p className="text-slate-300 text-sm mt-1">Gestión financiera y contable</p>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <PrintButton />
          </div>
        </div>
      </div>

      {/* Print header */}
      <div className="print-only hidden print-report-header">
        <div>
          <div className="print-report-title">Informe Comercial — Planta de Reciclado</div>
          <div className="print-report-meta">Generado: {new Date().toLocaleString('es-AR')}</div>
        </div>
      </div>

      {/* Actions row */}
      <div className="flex flex-wrap gap-2 no-print">
        <Link
          href="/comercial/cajas"
          className="inline-flex items-center px-3 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 shadow-sm transition-colors"
        >
          🏪 Cajas
        </Link>
        <Link
          href="/comercial/transacciones/nueva"
          className="inline-flex items-center px-3 py-2 border border-transparent rounded-xl text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-600 shadow-sm transition-colors"
        >
          + Nueva Transacción
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="stat-card p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Ingresos Hoy</p>
              <p className="mt-2 text-2xl font-bold text-emerald-600">${ingresos.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-lg flex-shrink-0">💰</div>
          </div>
        </div>

        <div className="stat-card p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Egresos Hoy</p>
              <p className="mt-2 text-2xl font-bold text-red-600">${egresos.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-red-500 flex items-center justify-center text-lg flex-shrink-0">💸</div>
          </div>
        </div>

        <div className="stat-card p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Balance Hoy</p>
              <p className={`mt-2 text-2xl font-bold ${balance >= 0 ? 'text-sky-600' : 'text-red-600'}`}>
                ${balance.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${balance >= 0 ? 'bg-sky-500' : 'bg-orange-500'}`}>
              📊
            </div>
          </div>
        </div>

        <div className="stat-card p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Cajas Activas</p>
              <p className="mt-2 text-2xl font-bold text-slate-800">{totalCajasActivas}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Saldo: ${saldoCajasActivas.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-violet-500 flex items-center justify-center text-lg flex-shrink-0">🏪</div>
          </div>
        </div>
      </div>

      {/* Cajas Activas */}
      {activeCashRegisters && activeCashRegisters.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Cajas Registradoras Activas</h3>
          </div>
          <ul className="divide-y divide-slate-100">
            {activeCashRegisters.map((caja: any) => (
              <li key={caja.id} className="px-5 py-4 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800">{caja.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {caja.openedByUser?.name || 'Desconocido'} · {new Date(caja.openedAt).toLocaleString('es-AR')}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-slate-400">Saldo Actual</p>
                  <p className="text-base font-bold text-slate-800">
                    ${caja.currentBalance.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Transacciones de Hoy */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Transacciones de Hoy</h3>
          <Link href="/comercial/transacciones" className="text-xs text-emerald-600 font-semibold hover:underline no-print">
            Ver todas →
          </Link>
        </div>
        <ul className="divide-y divide-slate-100">
          {todayTransactions && todayTransactions.length > 0 ? (
            todayTransactions.slice(0, 10).map((transaction: any) => (
              <li key={transaction.id} className="px-5 py-4 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                      transaction.type === 'INGRESO' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {transaction.type}
                    </span>
                    <span className="text-sm font-medium text-slate-800 truncate">{transaction.description}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {transaction.paymentMethod} · {new Date(transaction.date).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className={`text-base font-bold flex-shrink-0 ${transaction.type === 'INGRESO' ? 'text-emerald-600' : 'text-red-600'}`}>
                  {transaction.type === 'INGRESO' ? '+' : '-'}${transaction.amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </div>
              </li>
            ))
          ) : (
            <li className="px-5 py-10 text-center">
              <p className="text-slate-400 text-sm">Sin transacciones registradas hoy.</p>
              <Link href="/comercial/transacciones/nueva"
                className="mt-3 inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-emerald-500 rounded-xl hover:bg-emerald-600 transition-colors">
                + Nueva Transacción
              </Link>
            </li>
          )}
        </ul>
      </div>
    </div>
  )
}
