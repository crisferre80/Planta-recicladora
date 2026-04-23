'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/db'

export default function NuevaTransaccionPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [cashRegisters, setCashRegisters] = useState<any[]>([])
  
  const [formData, setFormData] = useState({
    cashRegisterId: '',
    type: 'INGRESO',
    amount: '',
    description: '',
    paymentMethod: 'EFECTIVO',
    notes: ''
  })

  useEffect(() => {
    const fetchCashRegisters = async () => {
      // Cargar cajas activas
      const { data } = await supabase
        .from('cash_registers')
        .select('id, name, currentBalance')
        .eq('isActive', true)
        .order('name')
      
      if (data) setCashRegisters(data)
    }

    fetchCashRegisters()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      // Obtener el usuario actual
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.user) {
        setError('No se encontró la sesión del usuario')
        setIsLoading(false)
        return
      }

      const amount = parseFloat(formData.amount)

      // Obtener la caja actual para actualizar el balance
      const { data: cashRegister } = await supabase
        .from('cash_registers')
        .select('currentBalance')
        .eq('id', formData.cashRegisterId)
        .single()

      if (!cashRegister) {
        setError('No se encontró la caja registradora')
        setIsLoading(false)
        return
      }

      // Calcular nuevo balance
      const newBalance = formData.type === 'INGRESO' 
        ? cashRegister.currentBalance + amount
        : cashRegister.currentBalance - amount

      // Insertar transacción
      const { error: insertError } = await supabase
        .from('transactions')
        .insert([{
          cashRegisterId: formData.cashRegisterId,
          type: formData.type,
          amount: amount,
          description: formData.description,
          paymentMethod: formData.paymentMethod,
          date: new Date().toISOString(),
          processedBy: session.user.id,
          notes: formData.notes || null
        }])

      if (insertError) {
        setError(insertError.message)
        setIsLoading(false)
        return
      }

      // Actualizar balance de la caja
      const { error: updateError } = await supabase
        .from('cash_registers')
        .update({ currentBalance: newBalance })
        .eq('id', formData.cashRegisterId)

      if (updateError) {
        console.error('Error updating cash register:', updateError)
      }

      // Redirigir a transacciones
      router.push('/comercial/transacciones')
      router.refresh()
    } catch (err) {
      console.error('Error:', err)
      setError('Error al registrar la transacción. Intente nuevamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Nueva Transacción
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Registre un ingreso o egreso en caja
          </p>
        </div>
      </div>

      <div className="bg-white shadow sm:rounded-lg">
        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">{error}</h3>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="cashRegisterId" className="block text-sm font-medium text-gray-700">
                Caja Registradora *
              </label>
              <select
                name="cashRegisterId"
                id="cashRegisterId"
                required
                value={formData.cashRegisterId}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">Seleccione una caja</option>
                {cashRegisters.map(caja => (
                  <option key={caja.id} value={caja.id}>
                    {caja.name} - Saldo: ${caja.currentBalance.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </option>
                ))}
              </select>
              {cashRegisters.length === 0 && (
                <p className="mt-1 text-sm text-red-600">
                  No hay cajas activas. Debe abrir una caja primero.
                </p>
              )}
            </div>

            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                Tipo *
              </label>
              <select
                name="type"
                id="type"
                required
                value={formData.type}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="INGRESO">Ingreso</option>
                <option value="EGRESO">Egreso</option>
              </select>
            </div>

            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                Monto *
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  name="amount"
                  id="amount"
                  required
                  step="0.01"
                  min="0.01"
                  value={formData.amount}
                  onChange={handleChange}
                  placeholder="0.00"
                  className="block w-full pl-7 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Descripción *
              </label>
              <input
                type="text"
                name="description"
                id="description"
                required
                value={formData.description}
                onChange={handleChange}
                placeholder="Ej: Venta de cartón, Pago de servicio, etc."
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700">
                Método de Pago *
              </label>
              <select
                name="paymentMethod"
                id="paymentMethod"
                required
                value={formData.paymentMethod}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="EFECTIVO">Efectivo</option>
                <option value="TRANSFERENCIA">Transferencia</option>
                <option value="CHEQUE">Cheque</option>
                <option value="TARJETA">Tarjeta</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                Notas Adicionales
              </label>
              <textarea
                name="notes"
                id="notes"
                rows={3}
                value={formData.notes}
                onChange={handleChange}
                placeholder="Información adicional sobre esta transacción..."
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>

          {/* Preview */}
          {formData.amount && formData.cashRegisterId && (
            <div className={`p-4 rounded-md ${formData.type === 'INGRESO' ? 'bg-green-50' : 'bg-red-50'}`}>
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg 
                    className={`h-5 w-5 ${formData.type === 'INGRESO' ? 'text-green-400' : 'text-red-400'}`}
                    viewBox="0 0 20 20" 
                    fill="currentColor"
                  >
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className={`text-sm font-medium ${formData.type === 'INGRESO' ? 'text-green-800' : 'text-red-800'}`}>
                    Vista Previa
                  </h3>
                  <div className={`mt-2 text-sm ${formData.type === 'INGRESO' ? 'text-green-700' : 'text-red-700'}`}>
                    <p>
                      Se registrará un <strong>{formData.type.toLowerCase()}</strong> de{' '}
                      <strong>${parseFloat(formData.amount).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</strong>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="pt-6 border-t border-gray-200 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading || cashRegisters.length === 0}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? 'Registrando...' : 'Registrar Transacción'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
