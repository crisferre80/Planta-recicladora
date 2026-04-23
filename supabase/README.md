# 🚀 Setup de Base de Datos - Supabase

## 📋 Instrucciones Completas

### 1️⃣ Aplicar Migración Principal

Ve al **SQL Editor de Supabase**:
```
https://app.supabase.com/project/hxpzzovirldbtlywdmnk/sql/new
```

**Copia y pega TODO el contenido** de:
```
supabase/migrations/20260421000000_initial_setup.sql
```

Haz clic en **RUN** ▶️

**Esto creará:**
- ✅ 17 tablas con relaciones completas
- ✅ 8 tipos ENUM
- ✅ Trigger automático para sincronizar `auth.users` → `public.users`
- ✅ Datos iniciales (turnos, materiales, equipos, impuestos, permisos)
- ✅ RLS deshabilitado en tabla `users` para permitir el trigger

---

### 2️⃣ Crear Usuarios de Prueba

**Opción A - SQL Editor (recomendado):**

Copia y pega TODO el contenido de:
```
supabase/create_test_users.sql
```

Ejecuta en SQL Editor. Esto creará 4 usuarios:

| Email | Password | Rol |
|-------|----------|-----|
| `admin@recicladora.com` | `admin123` | ADMIN |
| `supervisor@recicladora.com` | `super123` | SUPERVISOR |
| `operador@recicladora.com` | `oper123` | OPERADOR |
| `contador@recicladora.com` | `conta123` | CONTADOR |

**Opción B - UI de Supabase:**

Ve a: https://app.supabase.com/project/hxpzzovirldbtlywdmnk/auth/users

Crea manualmente cada usuario:
- **Email:** admin@recicladora.com
- **Password:** admin123
- ✅ **Auto Confirm User** (importante)

Luego actualiza el rol en SQL:
```sql
UPDATE public.users 
SET role = 'ADMIN'::"UserRole", name = 'Administrador'
WHERE email = 'admin@recicladora.com';
```

---

### 3️⃣ Verificar la Instalación

Ejecuta estos queries para confirmar:

```sql
-- Ver usuarios en auth.users
SELECT id, email, email_confirmed_at 
FROM auth.users 
WHERE email LIKE '%recicladora.com'
ORDER BY email;

-- Ver usuarios sincronizados en public.users
SELECT id, email, name, role 
FROM public.users 
WHERE email LIKE '%recicladora.com'
ORDER BY email;
```

**Ambos deben mostrar los mismos UUIDs** para cada email.

---

### 4️⃣ Probar el Login

1. Ve a tu aplicación: http://localhost:3000/login
2. Ingresa:
   - **Email:** `admin@recicladora.com`
   - **Password:** `admin123`
3. Haz clic en **Iniciar Sesión**

Deberías ser redirigido a `/dashboard` ✅

---

## 🔧 Troubleshooting

### Error: "Failed to create user"
- Verifica que ejecutaste la migración principal primero
- Confirma que el trigger existe:
  ```sql
  SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
  ```

### Error: "Password authentication failed"
- Asegúrate de que el usuario tenga `email_confirmed_at` con valor
- Usa `Auto Confirm User` al crear en la UI

### Usuario existe solo en `public.users`
- El trigger funciona solo en una dirección: `auth.users` → `public.users`
- SIEMPRE crea usuarios en `auth.users`, no directamente en `public.users`

### "Contraseña incorrecta" al hacer login
- Verifica que usaste `crypt()` con `gen_salt('bf')` en el INSERT
- O usa la UI de Supabase que hashea automáticamente

---

## 📊 Estructura Creada

### Tablas Principales:
- `users` - Usuarios del sistema
- `employees` - Empleados
- `attendances` - Control de asistencias
- `production_records` - Registros de producción
- `equipment` - Equipos y maquinaria
- `cash_registers` - Cajas registradoras
- `transactions` - Transacciones financieras
- `alerts` - Sistema de alertas
- `audit_logs` - Logs de auditoría

### Trigger Automático:
- Cuando creas un usuario en `auth.users` (Supabase Auth)
- Se crea automáticamente en `public.users` con rol OPERADOR
- Puedes cambiar el rol con UPDATE después

---

## 🎯 Próximos Pasos

1. ✅ Aplicar migración principal
2. ✅ Crear usuarios de prueba
3. ✅ Verificar con los SELECTs
4. ✅ Probar login en la app
5. 🚀 ¡Empezar a desarrollar!

---

## 📝 Notas Importantes

- **RLS está deshabilitado** en `users` para permitir el trigger
- **Passwords se guardan con bcrypt** automáticamente en auth.users
- **El trigger solo funciona** de auth → public (no al revés)
- **Roles por defecto:** OPERADOR (cambiar manualmente si necesario)
