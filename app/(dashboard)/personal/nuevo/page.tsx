'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/db'

export default function NuevoEmpleadoPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dni: '',
    phone: '',
    address: '',
    position: '',
    department: 'PRODUCCION',
    salary: '',
    hireDate: new Date().toISOString().split('T')[0],
    status: 'ACTIVO'
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    const reader = new FileReader()
    reader.onload = ev => setPhotoPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const { data, error: insertError } = await supabase
        .from('employees')
        .insert([{
          firstName: formData.firstName,
          lastName: formData.lastName,
          dni: formData.dni,
          phone: formData.phone,
          address: formData.address,
          position: formData.position,
          department: formData.department,
          salary: parseFloat(formData.salary),
          hireDate: new Date(formData.hireDate).toISOString(),
          status: formData.status
        }])
        .select()
        .single()

      if (insertError) { setError(insertError.message); return }

      // Subir foto si se seleccionó
      if (photoFile && data?.id) {
        const ext = photoFile.name.split('.').pop()?.toLowerCase() ?? 'jpg'
        const path = `employees/${data.id}/profile.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('employee-photos')
          .upload(path, photoFile, { upsert: true, contentType: photoFile.type })

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage.from('employee-photos').getPublicUrl(path)
          await supabase.from('employees').update({ photoUrl: publicUrl }).eq('id', data.id)
        } else if (photoPreview) {
          // Fallback: guardar base64
          await supabase.from('employees').update({ photoUrl: photoPreview }).eq('id', data.id)
        }
      }

      router.push('/personal')
      router.refresh()
    } catch (err) {
      console.error('Error:', err)
      setError('Error al crear el empleado. Intente nuevamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const initials = `${formData.firstName?.[0] ?? ''}${formData.lastName?.[0] ?? ''}`.toUpperCase()

  return (
    <div className="max-w-3xl mx-auto">
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Nuevo Empleado
          </h2>
        </div>
      </div>

      <div className="bg-white shadow sm:rounded-lg">
        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          )}

          {/* Foto de perfil */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Foto de perfil</label>
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                {photoPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photoPreview} alt="Preview" className="h-20 w-20 rounded-full object-cover border-2 border-gray-200" />
                ) : (
                  <div className="h-20 w-20 rounded-full bg-blue-600 flex items-center justify-center border-2 border-gray-200">
                    <span className="text-xl font-bold text-white">{initials || '?'}</span>
                  </div>
                )}
              </div>
              <label className="cursor-pointer border-2 border-dashed border-gray-300 rounded-lg px-4 py-3 hover:border-blue-400 hover:bg-blue-50 transition-colors text-center flex-1">
                <svg className="mx-auto h-6 w-6 text-gray-400 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-xs text-gray-500">
                  {photoFile ? photoFile.name : 'Seleccionar foto (opcional)'}
                </span>
                <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handlePhotoChange} />
              </label>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Información Personal</h3>
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                  Nombre *
                </label>
                <input
                  type="text"
                  name="firstName"
                  id="firstName"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                  Apellido *
                </label>
                <input
                  type="text"
                  name="lastName"
                  id="lastName"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="dni" className="block text-sm font-medium text-gray-700">
                  DNI *
                </label>
                <input
                  type="text"
                  name="dni"
                  id="dni"
                  required
                  value={formData.dni}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Teléfono *
                </label>
                <input
                  type="tel"
                  name="phone"
                  id="phone"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                  Dirección *
                </label>
                <textarea
                  name="address"
                  id="address"
                  required
                  rows={3}
                  value={formData.address}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>
          </div>

          {/* Información Laboral */}
          <div className="pt-6 border-t border-gray-200">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Información Laboral</h3>
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
              <div>
                <label htmlFor="position" className="block text-sm font-medium text-gray-700">
                  Cargo *
                </label>
                <input
                  type="text"
                  name="position"
                  id="position"
                  required
                  value={formData.position}
                  onChange={handleChange}
                  placeholder="Ej: Operador de Prensa"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="department" className="block text-sm font-medium text-gray-700">
                  Departamento *
                </label>
                <select
                  name="department"
                  id="department"
                  required
                  value={formData.department}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="PRODUCCION">Producción</option>
                  <option value="ADMINISTRACION">Administración</option>
                  <option value="VENTAS">Ventas</option>
                  <option value="LOGISTICA">Logística</option>
                  <option value="MANTENIMIENTO">Mantenimiento</option>
                </select>
              </div>

              <div>
                <label htmlFor="salary" className="block text-sm font-medium text-gray-700">
                  Salario *
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    name="salary"
                    id="salary"
                    required
                    step="0.01"
                    value={formData.salary}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 pl-7 pr-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="hireDate" className="block text-sm font-medium text-gray-700">
                  Fecha de Ingreso *
                </label>
                <input
                  type="date"
                  name="hireDate"
                  id="hireDate"
                  required
                  value={formData.hireDate}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  Estado *
                </label>
                <select
                  name="status"
                  id="status"
                  required
                  value={formData.status}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="ACTIVO">Activo</option>
                  <option value="INACTIVO">Inactivo</option>
                  <option value="SUSPENDIDO">Suspendido</option>
                  <option value="VACACIONES">Vacaciones</option>
                </select>
              </div>
            </div>
          </div>

          {/* Botones */}
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
              disabled={isLoading}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? 'Guardando...' : 'Guardar Empleado'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
