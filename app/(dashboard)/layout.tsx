'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'
import Image from 'next/image'
import {
  HomeIcon,
  UsersIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  BellIcon,
  ClipboardDocumentListIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  UserCircleIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline'
import { supabase } from '@/lib/db'

interface NavItem {
  name: string
  href: string
  icon: any
  badge?: number
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Personal', href: '/personal', icon: UsersIcon },
  { name: 'Producción', href: '/produccion', icon: ChartBarIcon },
  { name: 'Comercial', href: '/comercial', icon: CurrencyDollarIcon },
  { name: 'Alertas', href: '/alertas', icon: BellIcon },
  { name: 'Inventario', href: '/inventario', icon: ClipboardDocumentListIcon },
]

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [userEmail, setUserEmail] = useState<string>('')
  const [userName, setUserName] = useState<string>('')
  const [userRole, setUserRole] = useState<string>('')
  const [userAvatar, setUserAvatar] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setUserEmail(session.user.email || '')
        const { data } = await supabase
          .from('users')
          .select('name, role, avatarUrl')
          .eq('id', session.user.id)
          .single()
        if (data) {
          setUserName(data.name || '')
          setUserRole(data.role || '')
          setUserAvatar(data.avatarUrl || null)
        }
      }
    }
    checkUser()
  }, [])

  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const initials = userName
    ? userName.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
    : userEmail.slice(0, 2).toUpperCase()

  const roleLabels: Record<string, string> = {
    ADMIN: 'Administrador',
    SUPERVISOR: 'Supervisor',
    OPERADOR: 'Operador',
    CONTADOR: 'Contador',
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full" style={{ background: 'var(--sidebar-bg)' }}>
      {/* Logo Area */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          {/* Recycling icon mark */}
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <div>
            <p className="text-white text-sm font-bold leading-tight">EcoGestión</p>
            <p className="text-slate-400 text-xs leading-tight">Planta Recicladora</p>
          </div>
        </div>
        <button
          onClick={() => setSidebarOpen(false)}
          className="md:hidden text-slate-400 hover:text-white transition-colors"
          aria-label="Cerrar menú"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>

      {/* User Profile Block */}
      <Link href="/perfil" className="block mx-3 mt-4 mb-2 rounded-xl p-3 bg-slate-800 hover:bg-slate-700 transition-colors group">
        <div className="flex items-center gap-3">
          <div className="relative flex-shrink-0">
            {userAvatar ? (
              <Image
                src={userAvatar}
                alt={userName}
                width={40}
                height={40}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-emerald-500"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center ring-2 ring-emerald-500">
                <span className="text-white text-sm font-bold">{initials}</span>
              </div>
            )}
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-slate-800"></span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white text-sm font-semibold truncate leading-tight">
              {userName || userEmail.split('@')[0]}
            </p>
            <p className="text-slate-400 text-xs truncate mt-0.5">
              {roleLabels[userRole] || 'Usuario'}
            </p>
          </div>
          <Cog6ToothIcon className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors flex-shrink-0" />
        </div>
      </Link>

      {/* Navigation Label */}
      <p className="px-4 mt-3 mb-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">
        Menú Principal
      </p>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto pb-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-150
                ${isActive
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }
              `}
            >
              <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span className="flex-1">{item.name}</span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-white opacity-75 flex-shrink-0"></span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom: Logout */}
      <div className="p-3 border-t border-slate-800">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-slate-400 rounded-lg hover:bg-red-500/10 hover:text-red-400 transition-all"
        >
          <ArrowRightOnRectangleIcon className="w-5 h-5 flex-shrink-0" />
          Cerrar Sesión
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed inset-y-0 left-0 z-50 w-64
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
        `}
      >
        <SidebarContent />
      </div>

      {/* Main Content */}
      <div className="md:ml-64 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="sticky top-0 z-30 no-print" style={{ background: 'var(--header-bg)', borderBottom: '1px solid var(--card-border)' }}>
          <div className="flex items-center justify-between px-4 py-3 sm:px-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden flex-shrink-0 p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
                aria-label="Abrir menú"
              >
                <Bars3Icon className="w-5 h-5" />
              </button>
              <div>
                <p className="text-sm font-bold text-slate-800 leading-tight sm:text-base">
                  Planta de Reciclado
                </p>
                <p className="text-xs text-slate-500 hidden sm:block">
                  Termas de Río Hondo, Santiago del Estero
                </p>
              </div>
            </div>

            {/* Header right: avatar + name */}
            <div className="flex items-center gap-3">
              <Link href="/perfil" className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-semibold text-slate-700 leading-tight">
                    {userName || userEmail.split('@')[0]}
                  </p>
                  <p className="text-xs text-slate-400 leading-tight">{roleLabels[userRole] || 'Usuario'}</p>
                </div>
                {userAvatar ? (
                  <Image
                    src={userAvatar}
                    alt={userName}
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-emerald-400"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center ring-2 ring-emerald-400/40 flex-shrink-0">
                    <span className="text-white text-xs font-bold">{initials}</span>
                  </div>
                )}
              </Link>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6">{children}</main>

        {/* Footer */}
        <footer className="no-print px-6 py-3 text-center text-xs text-slate-400 border-t border-slate-200">
          EcoGestión v2.0 &mdash; Sistema de Gestión de Planta Recicladora
        </footer>
      </div>
    </div>
  )
}
