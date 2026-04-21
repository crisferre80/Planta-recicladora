'use client'

import { signOut, useSession } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'
import {
  HomeIcon,
  UsersIcon,
  CogIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  BellIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline'

interface NavItem {
  name: string
  href: string
  icon: any
  roles: string[]
}

const navigation: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: HomeIcon,
    roles: ['ADMIN', 'SUPERVISOR', 'OPERADOR', 'CONTADOR'],
  },
  {
    name: 'Personal',
    href: '/personal',
    icon: UsersIcon,
    roles: ['ADMIN', 'SUPERVISOR', 'OPERADOR'],
  },
  {
    name: 'Producción',
    href: '/produccion',
    icon: ChartBarIcon,
    roles: ['ADMIN', 'SUPERVISOR', 'OPERADOR'],
  },
  {
    name: 'Comercial',
    href: '/comercial',
    icon: CurrencyDollarIcon,
    roles: ['ADMIN', 'SUPERVISOR', 'CONTADOR'],
  },
  {
    name: 'Alertas',
    href: '/alertas',
    icon: BellIcon,
    roles: ['ADMIN', 'SUPERVISOR', 'OPERADOR', 'CONTADOR'],
  },
]

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { data: session } = useSession()
  const pathname = usePathname()

  // Filter navigation based on user role
  const filteredNavigation = navigation.filter((item) =>
    item.roles.includes(session?.user?.role || '')
  )

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-16 bg-green-600">
            <h1 className="text-white text-xl font-bold">
              Gestión Reciclado
            </h1>
          </div>

          {/* User Info */}
          <div className="px-4 py-4 border-b">
            <p className="text-sm font-medium text-gray-900">{session?.user?.name}</p>
            <p className="text-xs text-gray-500">{session?.user?.email}</p>
            <span className="inline-block mt-2 px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded">
              {session?.user?.role}
            </span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
            {filteredNavigation.map((item) => {
              const isActive = pathname.startsWith(item.href)
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    flex items-center px-3 py-2 text-sm font-medium rounded-md
                    ${
                      isActive
                        ? 'bg-green-100 text-green-900'
                        : 'text-gray-700 hover:bg-gray-100'
                    }
                  `}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* Logout Button */}
          <div className="p-4 border-t">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-3 py-2 text-sm font-medium text-red-700 rounded-md hover:bg-red-50"
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5 mr-3" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="px-6 py-4">
            <h2 className="text-2xl font-semibold text-gray-800">
              Planta de Reciclado - Termas de Río Hondo
            </h2>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}
