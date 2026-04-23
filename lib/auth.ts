import bcrypt from 'bcryptjs'

export type UserRole = 'ADMIN' | 'SUPERVISOR' | 'OPERADOR' | 'CONTADOR'

/**
 * Hash a password using bcrypt
 * @param password - Plain text password
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(password, salt)
}

/**
 * Verify a password against a hash
 * @param password - Plain text password
 * @param hash - Hashed password
 * @returns True if password matches
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

/**
 * Check if a user role has permission to access a resource
 * @param userRole - User's role
 * @param resource - Resource to access
 * @param action - Action to perform
 * @returns True if user has permission
 */
export function checkPermission(
  userRole: UserRole,
  resource: string,
  action: string
): boolean {
  // Define permission matrix
  const permissions: Record<UserRole, Record<string, string[]>> = {
    ADMIN: {
      '*': ['create', 'read', 'update', 'delete'], // Full access to all
    },
    SUPERVISOR: {
      employees: ['create', 'read', 'update', 'delete'],
      attendance: ['create', 'read', 'update'],
      shifts: ['create', 'read', 'update', 'delete'],
      production: ['create', 'read', 'update', 'delete'],
      equipment: ['create', 'read', 'update', 'delete'],
      commercial: ['read', 'update'],
      alerts: ['read', 'update'],
    },
    OPERADOR: {
      employees: ['read'],
      attendance: ['create', 'read', 'update'],
      shifts: ['read'],
      production: ['create', 'read', 'update'],
      equipment: ['read', 'update'],
      commercial: ['read'],
      alerts: ['read'],
    },
    CONTADOR: {
      employees: ['read'],
      production: ['read'],
      commercial: ['create', 'read', 'update', 'delete'],
      cash: ['create', 'read', 'update', 'delete'],
      taxes: ['create', 'read', 'update', 'delete'],
      alerts: ['read'],
    },
  }

  // Admin has access to everything
  if (userRole === 'ADMIN') {
    return true
  }

  const rolePermissions = permissions[userRole]
  if (!rolePermissions) {
    return false
  }

  // Check specific resource permission
  const resourcePermissions = rolePermissions[resource]
  if (resourcePermissions && resourcePermissions.includes(action)) {
    return true
  }

  return false
}

/**
 * Get user display name
 * @param user - User object with name
 * @returns Display name
 */
export function getUserDisplayName(user: { name: string }): string {
  return user.name
}

/**
 * Get role display name in Spanish
 * @param role - User role
 * @returns Spanish role name
 */
export function getRoleDisplayName(role: UserRole): string {
  const roleNames: Record<UserRole, string> = {
    ADMIN: 'Administrador',
    SUPERVISOR: 'Supervisor',
    OPERADOR: 'Operador',
    CONTADOR: 'Contador',
  }
  return roleNames[role]
}
