'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/db'
import PhotoUpload from './photo-upload'

interface Employee {
  id: string
  firstName: string
  lastName: string
  dni: string
  phone: string
  email?: string
  address: string
  position: string
  department: string
  salary: number
  hireDate: string
  status: string
  photoUrl?: string | null
}

interface Props {
  employee: Employee
}

export default function EditEmployeeForm({ employee }: Props) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [photoUrl, setPhotoUrl] = useState<string | null>(employee.photoUrl ?? null)
  const [formData, setFormData] = useState({
    firstName: employee.firstName ?? '',
    lastName: employee.lastName ?? '',
    dni: employee.dni ?? '',
    phone: employee.phone ?? '',
    email: employee.email ?? '',
    address: employee.address ?? '',
    position: employee.position ?? '',
    department: employee.department ?? 'PRODUCCION',
    salary: employee.salary?.toString() ?? '',
    hireDate: employee.hireDate ? employee.hireDate.slice(0, 10) : '',
    status: employee.status ?? 'ACTIVO',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const { error: updateError } = await supabase
        .from('employees')
        .update({
          firstName: formData.firstName,
          lastName: formData.lastName,
          dni: formData.dni,
          phone: formData.phone,
          email: formData.email || null,
          address: formData.address,
          position: formData.position,
          department: formData.department,
          salary: parseFloat(formData.salary),
          hireDate: formData.hireDate ? new Date(formData.hireDate).toISOString() : null,
          status: formData.status,
          photoUrl: photoUrl,
        })
        .eq('id', employee.id)

      if (updateError) {
        setError(updateError.message)
        return
      }

      setSuccess(true)
      setTimeout(() => {
        router.push(`/personal/${employee.id}`)
        router.refresh()
      }, 1200)
    } catch (err) {
      console.error(err)
      setError('Error al actualizar. Intente nuevamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const initials = `${formData.firstName?.[0] ?? ''}${formData.lastName?.[0] ?? ''}`.toUpperCase()

  const inputClass = 'mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm'

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6">
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm font-medium text-red-800">{error}</p>
        </div>
      )}
      {success && (
        <div className="rounded-md bg-green-50 p-4">
          <p className="text-sm font-medium text-green-800">✅ Datos actualizados correctamente. Redirigiendo...</p>
        </div>
      )}

      {/* Foto de perfil */}
      <PhotoUpload
        currentUrl={photoUrl}
        employeeId={employee.id}
        initials={initials}
        onUploaded={url => setPhotoUrl(url)}
      />

      {/* Información Personal */}
      <div className="pt-4 border-t border-gray-200">
        <h3 className="text-base font-medium text-gray-900 mb-4">Información Personal</h3>
        <div className="grid grid-cols-1 gap-y-5 gap-x-4 sm:grid-cols-2">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">Nombre *</label>
            <input type="text" name="firstName" id="firstName" required value={formData.firstName} onChange={handleChange} className={inputClass} />
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">Apellido *</label>
            <input type="text" name="lastName" id="lastName" required value={formData.lastName} onChange={handleChange} className={inputClass} />
          </div>
          <div>
            <label htmlFor="dni" className="block text-sm font-medium text-gray-700">DNI *</label>
            <input type="text" name="dni" id="dni" required value={formData.dni} onChange={handleChange} className={inputClass} />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Teléfono *</label>
            <input type="tel" name="phone" id="phone" required value={formData.phone} onChange={handleChange} className={inputClass} />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
            <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} className={inputClass} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="address" className="block text-sm font-medium text-gray-700">Dirección *</label>
            <textarea name="address" id="address" required rows={2} value={formData.address} onChange={handleChange} className={inputClass} />
          </div>
        </div>
      </div>

      {/* Información Laboral */}
      <div className="pt-4 border-t border-gray-200">
        <h3 className="text-base font-medium text-gray-900 mb-4">Información Laboral</h3>
        <div className="grid grid-cols-1 gap-y-5 gap-x-4 sm:grid-cols-2">
          <div>
            <label htmlFor="position" className="block text-sm font-medium text-gray-700">Cargo *</label>
            <input type="text" name="position" id="position" required value={formData.position} onChange={handleChange} placeholder="Ej: Operador de Prensa" className={inputClass} />
          </div>
          <div>
            <label htmlFor="department" className="block text-sm font-medium text-gray-700">Departamento *</label>
            <select name="department" id="department" required value={formData.department} onChange={handleChange} className={inputClass}>
              <option value="PRODUCCION">Producción</option>
              <option value="ADMINISTRACION">Administración</option>
              <option value="VENTAS">Ventas</option>
              <option value="LOGISTICA">Logística</option>
              <option value="MANTENIMIENTO">Mantenimiento</option>
            </select>
          </div>
          <div>
            <label htmlFor="salary" className="block text-sm font-medium text-gray-700">Salario *</label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">$</span>
              </div>
              <input type="number" name="salary" id="salary" required step="0.01" value={formData.salary} onChange={handleChange}
                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 pl-7 pr-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
            </div>
          </div>
          <div>
            <label htmlFor="hireDate" className="block text-sm font-medium text-gray-700">Fecha de Ingreso *</label>
            <input type="date" name="hireDate" id="hireDate" required value={formData.hireDate} onChange={handleChange} className={inputClass} />
          </div>
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">Estado *</label>
            <select name="status" id="status" required value={formData.status} onChange={handleChange} className={inputClass}>
              <option value="ACTIVO">Activo</option>
              <option value="INACTIVO">Inactivo</option>
              <option value="SUSPENDIDO">Suspendido</option>
              <option value="VACACIONES">Vacaciones</option>
            </select>
          </div>
        </div>
      </div>

      {/* Botones */}
      <div className="pt-5 border-t border-gray-200 flex justify-end space-x-3">
        <button type="button" onClick={() => router.back()}
          className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
          Cancelar
        </button>
        <button type="submit" disabled={isLoading || success}
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50">
          {isLoading ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  )
}
