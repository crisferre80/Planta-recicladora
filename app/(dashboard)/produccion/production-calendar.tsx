'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/db'

const formatDateShort = (date: Date) => date.toISOString().slice(0, 10)
const buildRange = (dateString: string) => ({
  start: `${dateString} 00:00:00`,
  end: `${dateString} 23:59:59`
})

export default function ProductionCalendar() {
  const [selectedDate, setSelectedDate] = useState(formatDateShort(new Date()))
  const [records, setRecords] = useState<any[]>([])
  const [summary, setSummary] = useState({ totalKg: 0, totalValue: 0, totalRecords: 0 })
  const [monthSummary, setMonthSummary] = useState({ totalKg: 0, totalValue: 0, daysWithProduction: 0 })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const { start, end } = buildRange(selectedDate)
      const { data, error } = await supabase
        .from('production_records')
        .select('quantity, date, materialType:material_types!materialTypeId(name, pricePerUnit)')
        .gte('date', start)
        .lte('date', end)
        .order('date', { ascending: true })

      if (error) {
        console.error('Error fetching production day:', error)
        setLoading(false)
        return
      }

      const parsed = data ?? []
      const totals = parsed.reduce(
        (acc, item) => {
          const qty = item.quantity || 0
          const price = item.materialType?.pricePerUnit || 0
          acc.totalKg += qty
          acc.totalValue += qty * price
          return acc
        },
        { totalKg: 0, totalValue: 0 }
      )

      setRecords(parsed)
      setSummary({ totalKg: totals.totalKg, totalValue: totals.totalValue, totalRecords: parsed.length })

      const year = selectedDate.slice(0, 4)
      const month = selectedDate.slice(5, 7)
      const monthLastDay = new Date(parseInt(year, 10), parseInt(month, 10), 0).getDate().toString().padStart(2, '0')
      const monthStart = `${year}-${month}-01 00:00:00`
      const monthEnd = `${year}-${month}-${monthLastDay} 23:59:59`
      const { data: monthData, error: monthError } = await supabase
        .from('production_records')
        .select('quantity, date, materialType:material_types!materialTypeId(pricePerUnit)')
        .gte('date', monthStart)
        .lte('date', monthEnd)

      if (monthError) {
        console.error('Error fetching month production:', monthError)
        setLoading(false)
        return
      }

      const groupByDay: Record<string, number> = {}
      ;(monthData ?? []).forEach((item: any) => {
        const day = new Date(item.date).toISOString().slice(0, 10)
        groupByDay[day] = (groupByDay[day] || 0) + (item.quantity || 0)
      })

      const monthTotal = (monthData ?? []).reduce((acc: number, item: any) => acc + (item.quantity || 0), 0)
      const monthTotalValue = (monthData ?? []).reduce((acc: number, item: any) => acc + ((item.quantity || 0) * (item.materialType?.pricePerUnit || 0)), 0)
      setMonthSummary({ totalKg: monthTotal, totalValue: monthTotalValue, daysWithProduction: Object.keys(groupByDay).length })
      setLoading(false)
    }

    load()
  }, [selectedDate])

  const totalTons = useMemo(() => summary.totalKg / 1000, [summary.totalKg])
  const monthlyTons = useMemo(() => monthSummary.totalKg / 1000, [monthSummary.totalKg])

  return (
    <div className="bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-medium leading-6 text-gray-900">Calendario de Producción</h2>
            <p className="mt-1 text-sm text-gray-500">
              Elige una fecha y revisa la producción diaria y el resumen mensual.
            </p>
          </div>
          <div>
            <label htmlFor="productionDate" className="block text-sm font-medium text-gray-700">
              Fecha
            </label>
            <input
              id="productionDate"
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              className="mt-1 block rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
        {loading ? (
          <p className="text-sm text-gray-500">Cargando producción...</p>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Producción del día</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900">{summary.totalKg.toLocaleString('es-AR')} kg</p>
                <p className="text-xs text-gray-500">{totalTons.toFixed(2)} Tn</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Ingresos estimados</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900">${summary.totalValue.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</p>
                <p className="text-xs text-gray-500">{summary.totalRecords} registros</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Resumen mensual</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900">{monthSummary.totalKg.toLocaleString('es-AR')} kg</p>
                <p className="text-xs text-gray-500">{monthlyTons.toFixed(2)} Tn • {monthSummary.daysWithProduction} días</p>
              </div>
            </div>

            <div className="rounded-lg bg-white p-4 shadow-sm">
              <h3 className="text-sm font-medium text-gray-900">Producción del día</h3>
              <div className="mt-4 space-y-3">
                {records.length === 0 ? (
                  <p className="text-sm text-gray-500">No hay producción registrada para esta fecha.</p>
                ) : (
                  records.map((record) => (
                    <div key={record.date + record.materialType?.name} className="rounded-lg border border-gray-200 p-3">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="font-semibold text-gray-900">{record.materialType?.name || 'Material desconocido'}</p>
                          <p className="text-sm text-gray-500">{new Date(record.date).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-gray-900">{record.quantity.toLocaleString('es-AR')} kg</p>
                          <p className="text-sm text-gray-500">${((record.quantity || 0) * (record.materialType?.pricePerUnit || 0)).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
