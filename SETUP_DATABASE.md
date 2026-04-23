# ⚙️ Configuración de Base de Datos

Este documento explica cómo configurar la base de datos PostgreSQL para el sistema.

## Opción 1: PostgreSQL Local (Desarrollo)

### Windows

1. **Descargar PostgreSQL**:
   - Ir a https://www.postgresql.org/download/windows/
   - Descargar el instalador
   - Ejecutar e instalar con las opciones por defecto
   - Recordar la contraseña del usuario `postgres`

2. **Crear la base de datos**:
   ```bash
   # Abrir PowerShell y ejecutar:
   psql -U postgres
   
   # En el prompt de PostgreSQL:
   CREATE DATABASE gestion_recicladora;
   \q
   ```

3. **Configurar .env**:
   ```env
   DATABASE_URL="postgresql://postgres:TU_CONTRASEÑA@localhost:5432/gestion_recicladora?schema=public"
   ```

4. **Aplicar el schema**:
   ```bash
   npm run db:push
   npm run db:seed
   ```

### Linux/Mac

1. **Instalar PostgreSQL**:
   ```bash
   # Ubuntu/Debian
   sudo apt update
   sudo apt install postgresql postgresql-contrib
   
   # Mac con Homebrew
   brew install postgresql
   brew services start postgresql
   ```

2. **Crear la base de datos**:
   ```bash
   sudo -u postgres psql
   
   # En el prompt de PostgreSQL:
   CREATE DATABASE gestion_recicladora;
   CREATE USER recicladora_user WITH PASSWORD 'tu_password';
   GRANT ALL PRIVILEGES ON DATABASE gestion_recicladora TO recicladora_user;
   \q
   ```

3. **Configurar .env**:
   ```env
   DATABASE_URL="postgresql://recicladora_user:tu_password@localhost:5432/gestion_recicladora?schema=public"
   ```

4. **Aplicar el schema**:
   ```bash
   npm run db:push
   npm run db:seed
   ```

## Opción 2: PostgreSQL Cloud (Producción/Desarrollo)

### Neon (Recomendado - Free Tier Generoso)

1. **Crear cuenta**:
   - Ir a https://neon.tech
   - Crear cuenta gratuita
   - Crear un nuevo proyecto

2. **Obtener la URL de conexión**:
   - En el dashboard, copiar el "Connection String"
   - Ejemplo: `postgresql://user:password@host.region.neon.tech/dbname?sslmode=require`

3. **Configurar .env**:
   ```env
   DATABASE_URL="postgresql://user:password@host.region.neon.tech/dbname?sslmode=require"
   ```

4. **Aplicar el schema**:
   ```bash
   npm run db:push
   npm run db:seed
   ```

### Supabase (Alternativa con Free Tier)

1. **Crear cuenta**:
   - Ir a https://supabase.com
   - Crear cuenta gratuita
   - Crear un nuevo proyecto

2. **Obtener la URL de conexión**:
   - En Settings > Database
   - Copiar "Connection String" (modo "psql")
   - Reemplazar `[YOUR-PASSWORD]` con tu contraseña

3. **Configurar .env**:
   ```env
   DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres"
   ```

4. **Aplicar el schema**:
   ```bash
   npm run db:push
   npm run db:seed
   ```

### Railway (Alternativa)

1. **Crear cuenta**:
   - Ir a https://railway.app
   - Crear cuenta (gratis con $5 de crédito)
   - Crear nuevo proyecto > Add PostgreSQL

2. **Obtener la URL de conexión**:
   - Click en el servicio PostgreSQL
   - Copiar "Postgres Connection URL"

3. **Configurar .env**:
   ```env
   DATABASE_URL="postgresql://usuario:password@host:puerto/dbname"
   ```

4. **Aplicar el schema**:
   ```bash
   npm run db:push
   npm run db:seed
   ```

## Verificar Configuración

Una vez configurada la base de datos, verificar que todo funciona:

```bash
# 1. Generar cliente Prisma
npm run db:generate

# 2. Aplicar schema a la BD
npm run db:push

# 3. Poblar con datos iniciales
npm run db:seed

# 4. (Opcional) Abrir Prisma Studio para ver los datos
npm run db:studio
```

Si todo funciona correctamente, deberías ver:
- ✅ Cliente Prisma generado
- ✅ Tablas creadas en la base de datos
- ✅ 4 usuarios de prueba creados
- ✅ Datos de ejemplo (materiales, equipos, turnos)

## Solución de Problemas

### Error: "Can't reach database server"

**Causa**: PostgreSQL no está ejecutándose o la URL es incorrecta.

**Solución**:
- Verificar que PostgreSQL esté ejecutándose
- Revisar la `DATABASE_URL` en `.env`
- Verificar usuario/contraseña
- Verificar que el puerto (5432) esté correcto

### Error: "Database does not exist"

**Causa**: La base de datos no fue creada.

**Solución**:
```bash
psql -U postgres -c "CREATE DATABASE gestion_recicladora;"
```

### Error: "Permission denied"

**Causa**: El usuario no tiene permisos.

**Solución**:
```sql
GRANT ALL PRIVILEGES ON DATABASE gestion_recicladora TO tu_usuario;
```

### Error en seed: "Unique constraint failed"

**Causa**: Intentando ejecutar seed dos veces.

**Solución**:
El seed usa `upsert`, así que debería funcionar múltiples veces. Si falla:
```bash
# Limpiar y volver a empezar
npm run db:push --force-reset
npm run db:seed
```

## Herramientas Útiles

### Prisma Studio (GUI para la BD)

```bash
npm run db:studio
```

Abre una interfaz gráfica en el navegador para ver y editar datos.

### TablePlus / pgAdmin

Clientes GUI externos para PostgreSQL:
- **TablePlus**: https://tableplus.com (Mac/Windows/Linux)
- **pgAdmin**: https://www.pgadmin.org (Gratuito)
- **DBeaver**: https://dbeaver.io (Gratuito, multiplataforma)

## Backup y Restore

### Backup

```bash
# Local
pg_dump -U postgres gestion_recicladora > backup.sql

# Con contraseña en variable
$env:PGPASSWORD="tu_password"; pg_dump -U postgres gestion_recicladora > backup.sql
```

### Restore

```bash
# Local
psql -U postgres gestion_recicladora < backup.sql

# Con contraseña en variable
$env:PGPASSWORD="tu_password"; psql -U postgres gestion_recicladora < backup.sql
```

## Migraciones (Producción)

Para producción, usar migraciones en lugar de `db:push`:

```bash
# Crear migración
npm run db:migrate

# Aplicar migraciones pendientes
npx prisma migrate deploy
```

## Notas de Seguridad

⚠️ **IMPORTANTE**:

1. **Nunca** commitear el archivo `.env` al repositorio
2. **Siempre** usar contraseñas fuertes en producción
3. **Configurar** backups automáticos en producción
4. **Usar** SSL/TLS para conexiones a base de datos en producción
5. **Limitar** acceso a la base de datos solo a IPs conocidas

---

¿Problemas? Revisa la [documentación oficial de Prisma](https://www.prisma.io/docs)
