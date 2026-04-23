# ✅ Migración a Supabase Auth Completada

La migración de NextAuth a Supabase Auth ha sido completada. Sigue estos pasos para finalizar la configuración:

## 📋 Pasos pendientes:

### 1. Obtener la ANON_KEY de Supabase

1. Ve a: https://app.supabase.com/project/hxpzzovirldbtlywdmnk/settings/api
2. En la sección **"Project API keys"**, busca **"anon public"**
3. Copia el valor (es un JWT largo que empieza con `eyJ...`)
4. Abre el archivo `.env.local`
5. Reemplaza `OBTENER_DE_SUPABASE_SETTINGS_API` con la key que copiaste

### 2. Habilitar Email Auth en Supabase

1. Ve a: https://app.supabase.com/project/hxpzzovirldbtlywdmnk/auth/providers
2. Habilita **"Email"** si no está habilitado
3. **IMPORTANTE**: Deshabilita "Confirm email" temporalmente:
   - Settings → Auth → **Email Auth**
   - Desactiva "Enable email confirmations"
   - Esto permitirá login inmediato sin verificar email

### 3. Crear usuarios en Supabase Auth

Ahora los usuarios deben crearse en **Supabase Auth**, no en la tabla users de Prisma.

#### Opción A: Desde el Dashboard de Supabase (MÁS FÁCIL)

1. Ve a: https://app.supabase.com/project/hxpzzovirldbtlywdmnk/auth/users
2. Click en **"Add user"** → **"Create new user"**
3. Ingresa:
   - **Email**: `admin@recicladora.com`
   - **Password**: `admin123`
   - **Auto Confirm User**: ✅ (importante)
4. Click en **"Create user"**
5. Repite para otros usuarios:
   - `supervisor@recicladora.com` / `super123`
   - `operador@recicladora.com` / `oper123`
   - `contador@recicladora.com` / `conta123`

#### Opción B: Desde SQL Editor

1. Ve a: https://app.supabase.com/project/hxpzzovirldbtlywdmnk/sql/new
2. Ejecuta este SQL:

```sql
-- Crear usuario admin con password admin123
SELECT auth.create_user(
  email := 'admin@recicladora.com',
  password := 'admin123',
  email_confirm := true
);

-- Crear usuario supervisor
SELECT auth.create_user(
  email := 'supervisor@recicladora.com',
  password := 'super123',
  email_confirm := true
);

-- Crear usuario operador
SELECT auth.create_user(
  email := 'operador@recicladora.com',
  password := 'oper123',
  email_confirm := true
);

-- Crear usuario contador
SELECT auth.create_user(
  email := 'contador@recicladora.com',
  password := 'conta123',
  email_confirm := true
);
```

### 4. Configurar la URL de redirección

1. Ve a: https://app.supabase.com/project/hxpzzovirldbtlywdmnk/auth/url-configuration
2. En **"Site URL"** agrega: `http://localhost:3000`
3. En **"Redirect URLs"** agrega:
   - `http://localhost:3000/dashboard`
   - `http://localhost:3000/login`

### 5. Probar el login

```bash
# Regenera el cliente de Prisma (por si acaso)
npx prisma generate

# Inicia el servidor
npm run dev
```

Ve a http://localhost:3000/login e inicia sesión con:
- **Email**: `admin@recicladora.com`
- **Password**: `admin123`

## 🎯 Cambios realizados:

✅ Desinstalado NextAuth y dependencias  
✅ Instalado Supabase Auth (`@supabase/supabase-js`, `@supabase/ssr`)  
✅ Actualizado `lib/db.ts` con cliente de Supabase  
✅ Reemplazado página de login para usar Supabase Auth  
✅ Actualizado middleware para usar Supabase session  
✅ Removido `SessionProvider` de NextAuth  
✅ Eliminado API route de NextAuth  
✅ Limpiado variables de entorno de NextAuth  

## 🔑 Ventajas de Supabase Auth:

- ✅ **Gestión de usuarios desde Dashboard**: Crea/edita/elimina usuarios con clicks
- ✅ **Sin hashing manual**: Supabase maneja las contraseñas automáticamente
- ✅ **Reset password built-in**: Email de recuperación automático
- ✅ **Email verification**: Opcional pero disponible
- ✅ **OAuth providers**: Google, GitHub, etc. (si lo necesitas después)
- ✅ **Row Level Security**: Seguridad a nivel de base de datos

## 🔐 Gestión de usuarios futura:

Para crear nuevos usuarios:
1. Dashboard de Supabase → Authentication → Users → Add user
2. O usar el Admin API de Supabase desde tu aplicación

Para cambiar contraseñas:
1. Dashboard de Supabase → Click en el usuario → Reset password
2. O implementar "Forgot password" en tu app (Supabase lo maneja)

## ⚠️ IMPORTANTE:

- Los usuarios deben estar en **Supabase Auth** (tabla `auth.users`)
- Ya NO uses la tabla `users` de Prisma para autenticación
- La tabla `users` de Prisma puede seguir existiendo para datos adicionales

## 📚 Recursos:

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Supabase Dashboard](https://app.supabase.com/project/hxpzzovirldbtlywdmnk)
- [Auth UI Components](https://supabase.com/docs/guides/auth/auth-helpers/auth-ui)

---

Una vez completados estos pasos, ¡tu sistema estará completamente migrado a Supabase Auth! 🎉
