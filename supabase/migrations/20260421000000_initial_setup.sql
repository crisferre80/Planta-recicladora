-- ============================================
-- MIGRACIÓN COMPLETA - SISTEMA DE GESTIÓN DE PLANTA DE RECICLADO
-- Termas de Río Hondo - Santiago del Estero
-- Incluye: Schema, Triggers de Auth, Datos Iniciales
-- Compatible con Supabase/PostgreSQL
-- ============================================

-- ============================================
-- EXTENSIONES
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- ENUMS
-- ============================================
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'SUPERVISOR', 'OPERADOR', 'CONTADOR');
CREATE TYPE "EmployeeStatus" AS ENUM ('ACTIVO', 'INACTIVO', 'SUSPENDIDO', 'VACACIONES');
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENTE', 'AUSENTE', 'TARDE', 'JUSTIFICADO', 'FALTA');
CREATE TYPE "EquipmentStatus" AS ENUM ('OPERATIVO', 'MANTENIMIENTO', 'FUERA_DE_SERVICIO', 'EN_LLENADO');
CREATE TYPE "TransactionType" AS ENUM ('INGRESO', 'EGRESO');
CREATE TYPE "PaymentMethod" AS ENUM ('EFECTIVO', 'TRANSFERENCIA', 'CHEQUE', 'TARJETA');
CREATE TYPE "AlertType" AS ENUM ('AUSENCIA_EXCESIVA', 'EQUIPO_CAPACIDAD', 'DESCUADRE_CAJA', 'PRODUCCION_BAJA', 'MANTENIMIENTO_EQUIPO', 'OTRO');
CREATE TYPE "AlertSeverity" AS ENUM ('INFO', 'WARNING', 'CRITICAL');

-- Asegurar ownership de los ENUMs
ALTER TYPE "UserRole" OWNER TO postgres;
ALTER TYPE "EmployeeStatus" OWNER TO postgres;
ALTER TYPE "AttendanceStatus" OWNER TO postgres;
ALTER TYPE "EquipmentStatus" OWNER TO postgres;
ALTER TYPE "TransactionType" OWNER TO postgres;
ALTER TYPE "PaymentMethod" OWNER TO postgres;
ALTER TYPE "AlertType" OWNER TO postgres;
ALTER TYPE "AlertSeverity" OWNER TO postgres;

-- ============================================
-- TABLA: USUARIOS
-- ============================================
CREATE TABLE "users" (
    "id" TEXT PRIMARY KEY,
    "email" TEXT UNIQUE NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'OPERADOR',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "users_email_idx" ON "users"("email");

-- Deshabilitar RLS para permitir trigger de auth
ALTER TABLE "users" DISABLE ROW LEVEL SECURITY;

-- ============================================
-- TABLA: PERMISOS
-- ============================================
CREATE TABLE "permissions" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "resource" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "roles" "UserRole"[] NOT NULL
);

CREATE UNIQUE INDEX "permissions_resource_action_key" ON "permissions"("resource", "action");

-- ============================================
-- TABLA: EMPLEADOS
-- ============================================
CREATE TABLE "employees" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT UNIQUE,
    "dni" TEXT UNIQUE NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "hireDate" TIMESTAMP(3) NOT NULL,
    "salary" DOUBLE PRECISION,
    "status" "EmployeeStatus" NOT NULL DEFAULT 'ACTIVO',
    "phone" TEXT,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "employees_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "employees_dni_idx" ON "employees"("dni");
CREATE INDEX "employees_status_idx" ON "employees"("status");

-- ============================================
-- TABLA: TURNOS DE TRABAJO
-- ============================================
CREATE TABLE "work_shifts" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "name" TEXT UNIQUE NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "days" TEXT[] NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA: ASIGNACIONES DE TURNO
-- ============================================
CREATE TABLE "shift_assignments" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "employeeId" TEXT NOT NULL,
    "shiftId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "shift_assignments_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "shift_assignments_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "work_shifts"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "shift_assignments_employeeId_idx" ON "shift_assignments"("employeeId");
CREATE INDEX "shift_assignments_shiftId_idx" ON "shift_assignments"("shiftId");

-- ============================================
-- TABLA: ASISTENCIAS
-- ============================================
CREATE TABLE "attendances" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "employeeId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" "AttendanceStatus" NOT NULL,
    "checkIn" TIMESTAMP(3),
    "checkOut" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "attendances_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "attendances_employeeId_idx" ON "attendances"("employeeId");
CREATE INDEX "attendances_date_idx" ON "attendances"("date");
CREATE INDEX "attendances_status_idx" ON "attendances"("status");

-- ============================================
-- TABLA: TIPOS DE MATERIAL
-- ============================================
CREATE TABLE "material_types" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "name" TEXT UNIQUE NOT NULL,
    "description" TEXT,
    "unit" TEXT NOT NULL,
    "pricePerUnit" DOUBLE PRECISION NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "material_types_name_idx" ON "material_types"("name");

-- ============================================
-- TABLA: EQUIPOS
-- ============================================
CREATE TABLE "equipment" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "code" TEXT UNIQUE NOT NULL,
    "type" TEXT NOT NULL,
    "capacity" DOUBLE PRECISION NOT NULL,
    "currentLoad" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "EquipmentStatus" NOT NULL DEFAULT 'OPERATIVO',
    "location" TEXT,
    "lastMaintenanceDate" TIMESTAMP(3),
    "nextMaintenanceDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "equipment_code_idx" ON "equipment"("code");
CREATE INDEX "equipment_status_idx" ON "equipment"("status");

-- ============================================
-- TABLA: REGISTROS DE PRODUCCIÓN
-- ============================================
CREATE TABLE "production_records" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "materialTypeId" TEXT NOT NULL,
    "equipmentId" TEXT,
    "quantity" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "operatorId" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "production_records_materialTypeId_fkey" FOREIGN KEY ("materialTypeId") REFERENCES "material_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "production_records_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "production_records_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "production_records_materialTypeId_idx" ON "production_records"("materialTypeId");
CREATE INDEX "production_records_equipmentId_idx" ON "production_records"("equipmentId");
CREATE INDEX "production_records_date_idx" ON "production_records"("date");
CREATE INDEX "production_records_operatorId_idx" ON "production_records"("operatorId");

-- ============================================
-- TABLA: MANTENIMIENTOS
-- ============================================
CREATE TABLE "maintenances" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "equipmentId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "completedDate" TIMESTAMP(3),
    "technicianId" TEXT,
    "cost" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "maintenances_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "equipment"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "maintenances_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "maintenances_equipmentId_idx" ON "maintenances"("equipmentId");
CREATE INDEX "maintenances_scheduledDate_idx" ON "maintenances"("scheduledDate");

-- ============================================
-- TABLA: CAJAS REGISTRADORAS
-- ============================================
CREATE TABLE "cash_registers" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "name" TEXT UNIQUE NOT NULL,
    "openingBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currentBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "openedBy" TEXT NOT NULL,
    "closedBy" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "cash_registers_openedBy_fkey" FOREIGN KEY ("openedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "cash_registers_closedBy_fkey" FOREIGN KEY ("closedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "cash_registers_isActive_idx" ON "cash_registers"("isActive");

-- ============================================
-- TABLA: TRANSACCIONES
-- ============================================
CREATE TABLE "transactions" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "cashRegisterId" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedBy" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "transactions_cashRegisterId_fkey" FOREIGN KEY ("cashRegisterId") REFERENCES "cash_registers"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "transactions_processedBy_fkey" FOREIGN KEY ("processedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "transactions_cashRegisterId_idx" ON "transactions"("cashRegisterId");
CREATE INDEX "transactions_date_idx" ON "transactions"("date");
CREATE INDEX "transactions_type_idx" ON "transactions"("type");

-- ============================================
-- TABLA: IMPUESTOS
-- ============================================
CREATE TABLE "taxes" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "name" TEXT UNIQUE NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA: ALERTAS
-- ============================================
CREATE TABLE "alerts" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "type" "AlertType" NOT NULL,
    "severity" "AlertSeverity" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "relatedEntityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "alerts_type_idx" ON "alerts"("type");
CREATE INDEX "alerts_severity_idx" ON "alerts"("severity");
CREATE INDEX "alerts_isRead_idx" ON "alerts"("isRead");
CREATE INDEX "alerts_createdAt_idx" ON "alerts"("createdAt");

-- ============================================
-- TABLA: LOGS DE AUDITORÍA
-- ============================================
CREATE TABLE "audit_logs" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "changes" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");
CREATE INDEX "audit_logs_entityType_idx" ON "audit_logs"("entityType");
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- ============================================
-- FUNCIÓN: ACTUALIZAR TIMESTAMP
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

ALTER FUNCTION update_updated_at_column() OWNER TO postgres;

-- ============================================
-- TRIGGERS: UPDATED_AT
-- ============================================
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON "users" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON "employees" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_work_shifts_updated_at BEFORE UPDATE ON "work_shifts" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_attendances_updated_at BEFORE UPDATE ON "attendances" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_material_types_updated_at BEFORE UPDATE ON "material_types" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_equipment_updated_at BEFORE UPDATE ON "equipment" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_production_records_updated_at BEFORE UPDATE ON "production_records" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_maintenances_updated_at BEFORE UPDATE ON "maintenances" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cash_registers_updated_at BEFORE UPDATE ON "cash_registers" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON "transactions" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_taxes_updated_at BEFORE UPDATE ON "taxes" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_alerts_updated_at BEFORE UPDATE ON "alerts" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- PERMISOS Y OWNERSHIP PARA TRIGGER AUTH
-- ============================================
-- Asegurar ownership completo
ALTER TABLE IF EXISTS "users" OWNER TO postgres;
ALTER TABLE IF EXISTS "permissions" OWNER TO postgres;
ALTER TABLE IF EXISTS "employees" OWNER TO postgres;
ALTER TABLE IF EXISTS "work_shifts" OWNER TO postgres;
ALTER TABLE IF EXISTS "shift_assignments" OWNER TO postgres;
ALTER TABLE IF EXISTS "attendances" OWNER TO postgres;
ALTER TABLE IF EXISTS "material_types" OWNER TO postgres;
ALTER TABLE IF EXISTS "equipment" OWNER TO postgres;
ALTER TABLE IF EXISTS "production_records" OWNER TO postgres;
ALTER TABLE IF EXISTS "maintenances" OWNER TO postgres;
ALTER TABLE IF EXISTS "cash_registers" OWNER TO postgres;
ALTER TABLE IF EXISTS "transactions" OWNER TO postgres;
ALTER TABLE IF EXISTS "taxes" OWNER TO postgres;
ALTER TABLE IF EXISTS "alerts" OWNER TO postgres;
ALTER TABLE IF EXISTS "audit_logs" OWNER TO postgres;

-- Dar permisos completos a la tabla users (necesario para el trigger)
GRANT ALL ON public.users TO postgres;
GRANT ALL ON public.users TO service_role;
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.users TO anon;

-- ============================================
-- TRIGGER: SINCRONIZACIÓN AUTH → PUBLIC.USERS
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, password, name, role, "isActive", "createdAt", "updatedAt")
  VALUES (
    NEW.id::text,
    NEW.email,
    'supabase_auth',
    COALESCE(NEW.raw_user_meta_data->>'name', SPLIT_PART(NEW.email, '@', 1)),
    'OPERADOR'::"UserRole",
    true,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Asegurar que la función es propiedad de postgres
ALTER FUNCTION public.handle_new_user() OWNER TO postgres;

-- Dar permisos de ejecución a la función
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- DATOS INICIALES: TURNOS DE TRABAJO
-- ============================================
INSERT INTO "work_shifts" (id, name, "startTime", "endTime", days, "isActive") VALUES
('shift-manana', 'Turno Mañana', '08:00', '16:00', ARRAY['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'], true),
('shift-tarde', 'Turno Tarde', '16:00', '00:00', ARRAY['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'], true),
('shift-noche', 'Turno Noche', '00:00', '08:00', ARRAY['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'], true);

-- ============================================
-- DATOS INICIALES: TIPOS DE MATERIAL
-- ============================================
INSERT INTO "material_types" (id, name, description, unit, "pricePerUnit", "isActive") VALUES
('mat-carton', 'Cartón', 'Cartón reciclable', 'kg', 25.50, true),
('mat-papel', 'Papel', 'Papel blanco y mixto', 'kg', 18.00, true),
('mat-plastico-pet', 'Plástico PET', 'Botellas PET', 'kg', 32.00, true),
('mat-plastico-hdpe', 'Plástico HDPE', 'Plástico duro', 'kg', 28.00, true),
('mat-vidrio', 'Vidrio', 'Vidrio transparente y de color', 'kg', 8.50, true),
('mat-metal', 'Metal', 'Latas de aluminio y acero', 'kg', 45.00, true);

-- ============================================
-- DATOS INICIALES: EQUIPOS
-- ============================================
INSERT INTO "equipment" (id, name, code, type, capacity, "currentLoad", status, location) VALUES
('equip-prensa-1', 'Prensa Hidráulica 1', 'PH-001', 'Prensa', 500.0, 0, 'OPERATIVO', 'Área de Compactación'),
('equip-prensa-2', 'Prensa Hidráulica 2', 'PH-002', 'Prensa', 500.0, 0, 'OPERATIVO', 'Área de Compactación'),
('equip-trituradora', 'Trituradora Industrial', 'TR-001', 'Trituradora', 1000.0, 0, 'OPERATIVO', 'Área de Trituración'),
('equip-balanza-1', 'Balanza Industrial 1', 'BZ-001', 'Balanza', 2000.0, 0, 'OPERATIVO', 'Área de Pesaje'),
('equip-balanza-2', 'Balanza Industrial 2', 'BZ-002', 'Balanza', 2000.0, 0, 'OPERATIVO', 'Área de Pesaje');

-- ============================================
-- DATOS INICIALES: IMPUESTOS
-- ============================================
INSERT INTO "taxes" (id, name, rate, description, "isActive") VALUES
('tax-iva', 'IVA', 21.0, 'Impuesto al Valor Agregado', true),
('tax-iibb', 'Ingresos Brutos', 3.5, 'Impuesto sobre los Ingresos Brutos', true);

-- ============================================
-- DATOS INICIALES: PERMISOS
-- ============================================
INSERT INTO "permissions" (id, resource, action, roles) VALUES
('perm-dashboard-view', 'dashboard', 'view', ARRAY['ADMIN', 'SUPERVISOR', 'OPERADOR', 'CONTADOR']::"UserRole"[]),
('perm-users-manage', 'users', 'manage', ARRAY['ADMIN']::"UserRole"[]),
('perm-employees-view', 'employees', 'view', ARRAY['ADMIN', 'SUPERVISOR', 'OPERADOR']::"UserRole"[]),
('perm-employees-manage', 'employees', 'manage', ARRAY['ADMIN', 'SUPERVISOR']::"UserRole"[]),
('perm-attendance-view', 'attendance', 'view', ARRAY['ADMIN', 'SUPERVISOR', 'OPERADOR']::"UserRole"[]),
('perm-attendance-manage', 'attendance', 'manage', ARRAY['ADMIN', 'SUPERVISOR']::"UserRole"[]),
('perm-production-view', 'production', 'view', ARRAY['ADMIN', 'SUPERVISOR', 'OPERADOR']::"UserRole"[]),
('perm-production-manage', 'production', 'manage', ARRAY['ADMIN', 'SUPERVISOR', 'OPERADOR']::"UserRole"[]),
('perm-equipment-view', 'equipment', 'view', ARRAY['ADMIN', 'SUPERVISOR', 'OPERADOR']::"UserRole"[]),
('perm-equipment-manage', 'equipment', 'manage', ARRAY['ADMIN', 'SUPERVISOR']::"UserRole"[]),
('perm-transactions-view', 'transactions', 'view', ARRAY['ADMIN', 'SUPERVISOR', 'CONTADOR']::"UserRole"[]),
('perm-transactions-manage', 'transactions', 'manage', ARRAY['ADMIN', 'CONTADOR']::"UserRole"[]),
('perm-cash-register-view', 'cash_register', 'view', ARRAY['ADMIN', 'SUPERVISOR', 'CONTADOR']::"UserRole"[]),
('perm-cash-register-manage', 'cash_register', 'manage', ARRAY['ADMIN', 'CONTADOR']::"UserRole"[]),
('perm-reports-view', 'reports', 'view', ARRAY['ADMIN', 'SUPERVISOR', 'CONTADOR']::"UserRole"[]),
('perm-alerts-view', 'alerts', 'view', ARRAY['ADMIN', 'SUPERVISOR', 'OPERADOR', 'CONTADOR']::"UserRole"[]),
('perm-alerts-manage', 'alerts', 'manage', ARRAY['ADMIN', 'SUPERVISOR']::"UserRole"[]);

-- ============================================
-- COMENTARIOS FINALES
-- ============================================
COMMENT ON DATABASE postgres IS 'Sistema de Gestión de Planta Recicladora - Termas de Río Hondo';
COMMENT ON TABLE users IS 'Usuarios del sistema con autenticación Supabase';
COMMENT ON FUNCTION handle_new_user() IS 'Sincroniza automáticamente usuarios de auth.users a public.users';
COMMENT ON TRIGGER on_auth_user_created ON auth.users IS 'Trigger que crea registro en public.users cuando se crea en auth.users';
