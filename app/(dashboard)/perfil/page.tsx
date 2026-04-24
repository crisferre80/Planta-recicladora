'use client'

import { useState, useRef, useEffect } from 'react'
import { supabase } from '@/lib/db'
import Image from 'next/image'
import { CameraIcon, UserCircleIcon, CheckIcon, PencilSquareIcon } from '@heroicons/react/24/outline'

export default function PerfilPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      setUser(session.user)
      const { data } = await supabase
        .from('users')
        .select('name, role, avatarUrl, bio')
        .eq('id', session.user.id)
        .single()
      if (data) {
        setProfile(data)
        setName(data.name || '')
        setBio(data.bio || '')
        setAvatarPreview(data.avatarUrl || null)
      }
      setLoading(false)
    }
    load()
  }, [])

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    // Preview
    const reader = new FileReader()
    reader.onload = () => setAvatarPreview(reader.result as string)
    reader.readAsDataURL(file)

    // Upload
    const ext = file.name.split('.').pop()
    const path = `avatars/${user.id}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true })

    if (!uploadError) {
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
      await supabase.from('users').update({ avatarUrl: publicUrl }).eq('id', user.id)
      setAvatarPreview(publicUrl)
    }
  }

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    await supabase.from('users').update({ name, bio }).eq('id', user.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const roleLabels: Record<string, string> = {
    ADMIN: 'Administrador', SUPERVISOR: 'Supervisor', OPERADOR: 'Operador', CONTADOR: 'Contador'
  }

  const initials = name
    ? name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() || '?'

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 sm:text-3xl">Mi Perfil</h1>
        <p className="text-slate-500 text-sm mt-1">Administra tu información personal y avatar</p>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Cover */}
        <div
          className="h-28 sm:h-36"
          style={{ background: 'linear-gradient(135deg, #0f172a 0%, #064e3b 60%, #10b981 100%)' }}
        />

        {/* Avatar + basic info */}
        <div className="px-6 pb-6">
          <div className="flex items-end justify-between -mt-12 mb-4">
            <div className="relative">
              {avatarPreview ? (
                <Image
                  src={avatarPreview}
                  alt={name}
                  width={80}
                  height={80}
                  className="w-20 h-20 rounded-2xl object-cover ring-4 ring-white shadow-lg"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center ring-4 ring-white shadow-lg">
                  <span className="text-white text-2xl font-bold">{initials}</span>
                </div>
              )}
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-7 h-7 bg-emerald-500 hover:bg-emerald-600 rounded-lg flex items-center justify-center shadow-md transition-colors"
                title="Cambiar foto"
              >
                <CameraIcon className="w-3.5 h-3.5 text-white" />
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                {roleLabels[profile?.role] || 'Usuario'}
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-lg font-bold text-slate-800">{name || 'Sin nombre'}</p>
            <p className="text-sm text-slate-500">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
        <div className="flex items-center gap-2 mb-2">
          <PencilSquareIcon className="w-5 h-5 text-emerald-500" />
          <h2 className="text-base font-bold text-slate-700">Editar Información</h2>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
            Nombre completo
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Tu nombre completo"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
            Email
          </label>
          <input
            type="email"
            value={user?.email || ''}
            disabled
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-400 bg-slate-50 cursor-not-allowed"
          />
          <p className="text-xs text-slate-400 mt-1">El email no puede modificarse</p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
            Rol del sistema
          </label>
          <input
            type="text"
            value={roleLabels[profile?.role] || 'Usuario'}
            disabled
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-400 bg-slate-50 cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
            Descripción / Notas
          </label>
          <textarea
            value={bio}
            onChange={e => setBio(e.target.value)}
            rows={3}
            placeholder="Escribe una breve descripción..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition resize-none"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors disabled:opacity-60"
        >
          {saved ? (
            <>
              <CheckIcon className="w-4 h-4" />
              ¡Guardado!
            </>
          ) : (
            <>
              {saving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <CheckIcon className="w-4 h-4" />
              )}
              Guardar cambios
            </>
          )}
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Miembro desde', value: user?.created_at ? new Date(user.created_at).toLocaleDateString('es-AR', { month: 'short', year: 'numeric' }) : '--' },
          { label: 'Último acceso', value: user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString('es-AR') : '--' },
          { label: 'Rol', value: roleLabels[profile?.role] || 'Usuario' },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <p className="text-lg font-bold text-slate-800">{stat.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
