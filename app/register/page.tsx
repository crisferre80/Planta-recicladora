'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/db'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState<'ADMIN' | 'SUPERVISOR' | 'OPERADOR' | 'CONTADOR'>('OPERADOR')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setIsLoading(true)

    try {
      console.log('🔵 Creando usuario:', email)
      
      // 1. Crear usuario en Supabase Auth
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
          },
          emailRedirectTo: undefined, // No enviar email de confirmación
        },
      })

      console.log('📧 Respuesta de signUp:', { authData, signUpError })

      if (signUpError) {
        console.error('❌ Error al crear usuario en auth:', signUpError)
        setError(signUpError.message)
        return
      }

      if (!authData.user) {
        setError('No se pudo crear el usuario')
        return
      }

      console.log('✅ Usuario creado en auth.users:', authData.user.id)

      // 2. Crear usuario en public.users
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: email,
          password: 'supabase_auth',
          name: name,
          role: role,
          isActive: true,
        })

      if (insertError) {
        console.error('❌ Error al crear usuario en public.users:', insertError)
        setError(`Usuario creado en auth pero error en tabla: ${insertError.message}`)
        return
      }

      console.log('✅ Usuario creado en public.users')

      setSuccess(`¡Usuario ${email} creado exitosamente! Redirigiendo al login...`)
      
      setTimeout(() => {
        router.push('/login')
      }, 2000)

    } catch (err) {
      console.error('💥 Error general:', err)
      setError('Error al crear usuario. Intente nuevamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-lg">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            Crear Usuario
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sistema de Gestión - Planta de Reciclado
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {success && (
            <div className="rounded-md bg-green-50 p-4">
              <p className="text-sm text-green-800">{success}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Nombre Completo
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 text-gray-900"
                placeholder="Juan Pérez"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 text-gray-900"
                placeholder="usuario@ejemplo.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Contraseña (mínimo 6 caracteres)
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 text-gray-900"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                Rol
              </label>
              <select
                id="role"
                name="role"
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 text-gray-900"
              >
                <option value="OPERADOR">Operador</option>
                <option value="SUPERVISOR">Supervisor</option>
                <option value="CONTADOR">Contador</option>
                <option value="ADMIN">Administrador</option>
              </select>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creando usuario...' : 'Crear Usuario'}
            </button>
          </div>

          <div className="text-center">
            <Link href="/login" className="text-sm text-green-600 hover:text-green-500">
              ← Volver al Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
