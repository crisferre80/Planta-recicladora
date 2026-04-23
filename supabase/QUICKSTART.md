# Instrucciones Rápidas - Despliegue en Supabase

## ✅ Pasos para implementar

### 1. Crear proyecto en Supabase
- Ve a https://app.supabase.com
- Click en "New Project"
- Ingresa nombre, contraseña de base de datos y región
- Espera que el proyecto se inicialice

### 2. Aplicar migraciones

**Opción A - Usando la interfaz web (más simple):**

1. En tu proyecto de Supabase, ve a **SQL Editor**
2. Copia el contenido de `supabase/migrations/00001_initial_schema.sql`
3. Pégalo en el editor y click en **Run**
4. Repite con `supabase/migrations/00002_seed_data.sql`

**Opción B - Usando Supabase CLI:**

```bash
# Instalar CLI
npm install -g supabase

# Vincular proyecto
supabase link --project-ref [TU-PROJECT-REF]

# Aplicar migraciones
cd supabase/migrations
psql -h db.[TU-PROJECT-REF].supabase.co -U postgres -d postgres -f 00001_initial_schema.sql
psql -h db.[TU-PROJECT-REF].supabase.co -U postgres -d postgres -f 00002_seed_data.sql
```

### 3. Configurar variables de entorno

Crea/actualiza `.env.local`:

```env
# Obtén estos valores de: Settings → Database → Connection string
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="[genera-con: openssl rand -base64 32]"
```

### 4. Generar cliente de Prisma

```bash
# Sincronizar con la base de datos
npx prisma db pull

# Generar cliente
npx prisma generate
```

### 5. Probar la conexión

```bash
npm run dev
```

Inicia sesión con:
- Email: `admin@recicladora.com`
- Password: `admin123`

## 🔑 Usuarios de prueba

| Email | Password | Rol |
|-------|----------|-----|
| admin@recicladora.com | admin123 | ADMIN |
| supervisor@recicladora.com | super123 | SUPERVISOR |
| operador@recicladora.com | oper123 | OPERADOR |
| contador@recicladora.com | conta123 | CONTADOR |

## ⚠️ Importante para Producción

1. **Cambiar contraseñas de usuarios de prueba**
2. **Eliminar políticas RLS permisivas** (ver `supabase/README.md`)
3. **Generar nuevo NEXTAUTH_SECRET**
4. **Configurar dominios permitidos en Supabase Auth**

## 📚 Más información

Ver `supabase/README.md` para documentación completa.
