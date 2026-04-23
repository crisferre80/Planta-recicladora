# Configuración de Variables de Entorno

Este documento describe todas las variables de entorno necesarias para el proyecto.

## 📝 Archivo .env.local

Crea un archivo `.env.local` en la raíz del proyecto con el siguiente contenido:

```env
# ============================================
# BASE DE DATOS - SUPABASE
# ============================================

# URL de conexión a PostgreSQL (con pooling)
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:6543/postgres?pgbouncer=true"

# URL directa (sin pooling, para migraciones)
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# ============================================
# AUTENTICACIÓN - NEXTAUTH
# ============================================

# URL de la aplicación
NEXTAUTH_URL="http://localhost:3000"

# Secreto para JWT (genera uno nuevo)
NEXTAUTH_SECRET="[GENERA_UN_SECRET_ALEATORIO]"

# ============================================
# SUPABASE (OPCIONAL)
# ============================================

# Solo si usas Supabase Auth o Storage directamente
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[ANON-KEY]"
```

## 🔍 Cómo obtener los valores

### 1. Database URLs (Supabase)

1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Navega a **Settings** → **Database**
3. En "Connection string", selecciona:
   - **Session mode** (puerto 6543) para `DATABASE_URL`
   - **Transaction mode** (puerto 5432) para `DIRECT_URL`
4. Copia la URL y reemplaza `[YOUR-PASSWORD]` con tu contraseña

Ejemplo:
```
DATABASE_URL="postgresql://postgres:tu_password@db.abcdefghijk.supabase.co:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:tu_password@db.abcdefghijk.supabase.co:5432/postgres"
```

### 2. NEXTAUTH_SECRET

Genera un secreto aleatorio seguro:

**Opción A - OpenSSL:**
```bash
openssl rand -base64 32
```

**Opción B - Node.js:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Opción C - Online:**
- Visita: https://generate-secret.vercel.app/32
- Copia el secreto generado

### 3. NEXTAUTH_URL

- **Desarrollo local:** `http://localhost:3000`
- **Producción:** `https://tu-dominio.com`

### 4. Supabase Keys (Opcional)

Solo necesario si usas funciones de Supabase directamente (Auth, Storage, Realtime):

1. Ve a **Settings** → **API** en Supabase Dashboard
2. Copia:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## ⚙️ Variables adicionales (opcional)

### Modo de desarrollo
```env
NODE_ENV="development"  # o "production"
```

### Email (para notificaciones futuras)
```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="tu-email@gmail.com"
SMTP_PASSWORD="tu-app-password"
```

## ✅ Validar configuración

Después de configurar las variables:

```bash
# 1. Instalar dependencias
npm install

# 2. Generar cliente de Prisma
npx prisma generate

# 3. Verificar conexión a la base de datos
npx prisma db push

# 4. Iniciar servidor de desarrollo
npm run dev
```

Si todo está configurado correctamente, deberías poder acceder a `http://localhost:3000` y ver la aplicación.

## 🔒 Seguridad

### ⚠️ IMPORTANTE

- **NUNCA** commitees archivos `.env.local` o `.env` al repositorio
- **NUNCA** compartas tus secretos públicamente
- Usa diferentes secretos para desarrollo y producción
- Rota tus secretos regularmente en producción

### Archivos que deben estar en .gitignore

```
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
```

## 🚀 Despliegue en Producción

### Vercel

1. Ve a tu proyecto en Vercel Dashboard
2. **Settings** → **Environment Variables**
3. Agrega cada variable con su valor de producción
4. Redeploy el proyecto

### Otras plataformas

Consulta la documentación específica de tu plataforma para configurar variables de entorno.

## 🐛 Troubleshooting

### Error: "Invalid `prisma.xxx()` invocation"
- Verifica que `DATABASE_URL` y `DIRECT_URL` sean correctos
- Asegúrate de haber ejecutado `npx prisma generate`

### Error: "password authentication failed"
- Verifica que la contraseña en la URL sea correcta
- Resetea la contraseña en Supabase: Settings → Database → Database Password

### Error: "NEXTAUTH_SECRET must be provided"
- Asegúrate de haber definido `NEXTAUTH_SECRET` en `.env.local`
- Reinicia el servidor de desarrollo después de agregar la variable

### La aplicación no se conecta a la base de datos
- Verifica que el proyecto de Supabase esté activo
- Comprueba que la IP esté permitida (Supabase permite todas por defecto)
- Usa `npx prisma db push` para verificar la conexión

## 📚 Recursos

- [Supabase Database Settings](https://supabase.com/docs/guides/database/connecting-to-postgres)
- [NextAuth.js Configuration](https://next-auth.js.org/configuration/options)
- [Prisma Connection URLs](https://www.prisma.io/docs/reference/database-reference/connection-urls)
