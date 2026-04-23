'use client'

import { ReactNode } from 'react'

export function SessionProvider({ children }: { children: ReactNode }) {
  // Supabase Auth no requiere un SessionProvider como NextAuth
  return <>{children}</>
}
