# Sistema de Gestión - Planta de Reciclado

Sistema integral de gestión para planta de reciclado en Termas de Río Hondo, Santiago del Estero.

## 🚀 Stack Tecnológico

- **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Base de Datos**: PostgreSQL con Prisma ORM
- **Autenticación**: NextAuth.js
- **UI**: Heroicons, Tailwind CSS

## 📋 Requisitos Previos

- Node.js 18+ y npm
- PostgreSQL 14+ (local o cloud)
- Git

## 🔧 Instalación

### 1. Clonar el repositorio

```bash
git clone <repository-url>
cd gestion-planta-recicladora
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Copiar `.env.example` a `.env` y configurar:

```bash
cp .env.example .env
```

Editar `.env` con tus credenciales:

```env
# Base de datos PostgreSQL
DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/gestion_recicladora?schema=public"

# NextAuth - Generar con: openssl rand -base64 32
NEXTAUTH_SECRET="tu-secreto-aqui"
NEXTAUTH_URL="http://localhost:3000"
```

### 4. Configurar la base de datos

```bash
# Crear las tablas en la base de datos
npm run db:push

# Generar el cliente de Prisma
npm run db:generate

# Poblar con datos iniciales (usuarios, materiales, equipos)
npm run db:seed
```

### 5. Ejecutar en modo desarrollo

```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000) en el navegador.

## 👥 Usuarios de Prueba

Después de ejecutar el seed, puedes usar estos usuarios:

| Rol | Email | Contraseña | Permisos |
|-----|-------|------------|----------|
| **Admin** | admin@recicladora.com | admin123 | Acceso total |
| **Supervisor** | supervisor@recicladora.com | super123 | Personal, Producción, Comercial (lectura) |
| **Operador** | operador@recicladora.com | oper123 | Personal, Producción |
| **Contador** | contador@recicladora.com | conta123 | Comercial completo, Producción (lectura) |

## 📦 Módulos Implementados

### ✅ Fase 1: Infraestructura Base (COMPLETADO)

- [x] Proyecto Next.js con TypeScript
- [x] Prisma ORM configurado
- [x] Schema completo de base de datos
- [x] NextAuth con autenticación por credenciales
- [x] Middleware de autorización por roles
- [x] Layout base con navegación contextual

### 🔄 Próximas Fases

#### Fase 2: Gestión de Personal
- [ ] CRUD de empleados
- [ ] Sistema de asistencias (check-in/check-out)
- [ ] Gestión de turnos y horarios
- [ ] Seguimiento de productividad individual

#### Fase 3: Gestión de Producción
- [ ] Registro de producción diaria
- [ ] Gestión de equipos de compactación
- [ ] Sistema de métricas y análisis
- [ ] Dashboard de producción con KPIs

#### Fase 4: Sistema Comercial
- [ ] Gestión de ingresos
- [ ] Gestión de egresos y gastos
- [ ] Control de caja diario
- [ ] Módulo de impuestos
- [ ] Reportes financieros

#### Fase 5: Reportes y Alertas
- [ ] Generación de reportes PDF
- [ ] Exportación a Excel
- [ ] Sistema de alertas automáticas
- [ ] Gráficos de tendencias

## 🗄️ Estructura del Proyecto

```
gestion-planta-recicladora/
├── app/
│   ├── (dashboard)/          # Rutas autenticadas
│   │   ├── dashboard/        # Dashboard principal
│   │   ├── personal/         # Gestión de personal (próximo)
│   │   ├── produccion/       # Gestión de producción (próximo)
│   │   └── comercial/        # Sistema comercial (próximo)
│   ├── api/
│   │   └── auth/             # API de autenticación
│   ├── login/                # Página de login
│   └── unauthorized/         # Página de acceso denegado
├── lib/
│   ├── db.ts                 # Cliente Prisma singleton
│   └── auth.ts               # Utilidades de autenticación
├── prisma/
│   ├── schema.prisma         # Modelos de datos
│   └── seed.ts               # Datos iniciales
└── middleware.ts             # Protección de rutas
```

## 🛠️ Scripts Disponibles

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build de producción
npm run start        # Servidor de producción
npm run lint         # Linter ESLint

npm run db:push      # Aplicar schema a la BD
npm run db:migrate   # Crear migración
npm run db:seed      # Poblar datos iniciales
npm run db:studio    # Abrir Prisma Studio (GUI)
npm run db:generate  # Generar cliente Prisma
```

## 🔐 Roles y Permisos

### ADMIN
- Acceso total a todo el sistema
- Gestión de usuarios
- Configuración del sistema

### SUPERVISOR
- Gestión de personal (completo)
- Gestión de producción (completo)
- Sistema comercial (solo lectura)
- Alertas (lectura y actualización)

### OPERADOR
- Personal (solo lectura)
- Asistencias (registro y visualización)
- Producción (registro y visualización)
- Equipos (lectura y actualización de llenado)

### CONTADOR
- Sistema comercial (completo)
- Producción (solo lectura para costos)
- Reportes financieros
- Gestión de impuestos

## 📊 Modelos de Datos Principales

- **User**: Usuarios del sistema
- **Employee**: Empleados de la planta
- **Attendance**: Asistencias y control horario
- **WorkShift**: Turnos de trabajo
- **ProductionDay**: Producción diaria
- **Equipment**: Equipos de compactación
- **MaterialType**: Tipos de materiales reciclables
- **Transaction**: Transacciones comerciales
- **CashRegister**: Control de caja
- **Alert**: Alertas y notificaciones

## 🚀 Deployment

### Opción 1: Vercel (Recomendado)

1. Conectar repositorio en [vercel.com](https://vercel.com)
2. Configurar variables de entorno
3. Conectar base de datos (Neon, Supabase, etc.)
4. Deploy automático

### Opción 2: VPS/Servidor Propio

```bash
npm run build
npm run start
```

Configurar Nginx/Apache como reverse proxy.

## 🐛 Troubleshooting

### Error de conexión a la base de datos

Verificar que PostgreSQL esté ejecutándose y la URL en `.env` sea correcta.

```bash
# Verificar conexión
npx prisma db pull
```

### Error en autenticación

Verificar que `NEXTAUTH_SECRET` esté configurado en `.env`.

```bash
# Generar nuevo secreto
openssl rand -base64 32
```

### Error al ejecutar seed

Asegurarse de que el schema esté aplicado:

```bash
npm run db:push
npm run db:seed
```

## 📝 Licencia

Proyecto privado - Planta de Reciclado Termas de Río Hondo

## 👨‍💻 Autor

Sistema desarrollado para la gestión integral de la planta de reciclado.

---

**Fecha de creación**: Abril 2026  
**Ubicación**: Termas de Río Hondo, Santiago del Estero, Argentina

