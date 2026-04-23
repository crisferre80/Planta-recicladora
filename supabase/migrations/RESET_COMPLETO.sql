-- ============================================
-- RESET COMPLETO Y MIGRACIÓN - TODO EN UNO
-- Ejecutar este archivo COMPLETO de una sola vez
-- ============================================

-- ============================================
-- PASO 1: LIMPIEZA FORZADA
-- ============================================

-- Eliminar trigger de auth si existe (primero)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;

-- Limpieza simple y directa
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.alerts CASCADE;
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.cash_registers CASCADE;
DROP TABLE IF EXISTS public.maintenances CASCADE;
DROP TABLE IF EXISTS public.production_records CASCADE;
DROP TABLE IF EXISTS public.equipment CASCADE;
DROP TABLE IF EXISTS public.material_types CASCADE;
DROP TABLE IF EXISTS public.attendances CASCADE;
DROP TABLE IF EXISTS public.shift_assignments CASCADE;
DROP TABLE IF EXISTS public.work_shifts CASCADE;
DROP TABLE IF EXISTS public.employees CASCADE;
DROP TABLE IF EXISTS public.permissions CASCADE;
DROP TABLE IF EXISTS public.taxes CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Eliminar funciones
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

-- Eliminar tipos/ENUMs
DROP TYPE IF EXISTS public."AlertSeverity" CASCADE;
DROP TYPE IF EXISTS public."AlertType" CASCADE;
DROP TYPE IF EXISTS public."PaymentMethod" CASCADE;
DROP TYPE IF EXISTS public."TransactionType" CASCADE;
DROP TYPE IF EXISTS public."EquipmentStatus" CASCADE;
DROP TYPE IF EXISTS public."AttendanceStatus" CASCADE;
DROP TYPE IF EXISTS public."EmployeeStatus" CASCADE;
DROP TYPE IF EXISTS public."UserRole" CASCADE;

-- ============================================
-- PASO 2: EXTENSIONES
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- PASO 3: ENUMS
-- ============================================
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'SUPERVISOR', 'OPERADOR', 'CONTADOR');
CREATE TYPE "EmployeeStatus" AS ENUM ('ACTIVO', 'INACTIVO', 'SUSPENDIDO', 'VACACIONES');
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENTE', 'AUSENTE', 'TARDE', 'JUSTIFICADO', 'FALTA');
CREATE TYPE "EquipmentStatus" AS ENUM ('OPERATIVO', 'MANTENIMIENTO', 'FUERA_DE_SERVICIO', 'EN_LLENADO');
CREATE TYPE "TransactionType" AS ENUM ('INGRESO', 'EGRESO');
CREATE TYPE "PaymentMethod" AS ENUM ('EFECTIVO', 'TRANSFERENCIA', 'CHEQUE', 'TARJETA');
CREATE TYPE "AlertType" AS ENUM ('AUSENCIA_EXCESIVA', 'EQUIPO_CAPACIDAD', 'DESCUADRE_CAJA', 'PRODUCCION_BAJA', 'MANTENIMIENTO_EQUIPO', 'OTRO');
CREATE TYPE "AlertSeverity" AS ENUM ('INFO', 'WARNING', 'CRITICAL');

-- ============================================
-- PASO 4: TABLA USUARIOS
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

-- ============================================
-- PASO 5: RESTO DE TABLAS
-- ============================================
CREATE TABLE "permissions" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "resource" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "roles" "UserRole"[] NOT NULL
);

CREATE UNIQUE INDEX "permissions_resource_action_key" ON "permissions"("resource", "action");

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

CREATE TABLE "taxes" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "name" TEXT UNIQUE NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

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
-- PASO 6: TRIGGER UPDATE_AT
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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
-- PASO 7: DATOS INICIALES
-- ============================================
INSERT INTO "work_shifts" (id, name, "startTime", "endTime", days, "isActive") VALUES
('shift-manana', 'Turno Mañana', '08:00', '16:00', ARRAY['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'], true),
('shift-tarde', 'Turno Tarde', '16:00', '00:00', ARRAY['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'], true),
('shift-noche', 'Turno Noche', '00:00', '08:00', ARRAY['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'], true);

INSERT INTO "material_types" (id, name, description, unit, "pricePerUnit", "isActive") VALUES
('mat-carton', 'Cartón', 'Cartón reciclable', 'kg', 25.50, true),
('mat-papel', 'Papel', 'Papel blanco y mixto', 'kg', 18.00, true),
('mat-plastico-pet', 'Plástico PET', 'Botellas PET', 'kg', 32.00, true),
('mat-plastico-hdpe', 'Plástico HDPE', 'Plástico duro', 'kg', 28.00, true),
('mat-vidrio', 'Vidrio', 'Vidrio transparente y de color', 'kg', 8.50, true),
('mat-metal', 'Metal', 'Latas de aluminio y acero', 'kg', 45.00, true);

INSERT INTO "equipment" (id, name, code, type, capacity, "currentLoad", status, location) VALUES
('equip-prensa-1', 'Prensa Hidráulica 1', 'PH-001', 'Prensa', 500.0, 0, 'OPERATIVO', 'Área de Compactación'),
('equip-prensa-2', 'Prensa Hidráulica 2', 'PH-002', 'Prensa', 500.0, 0, 'OPERATIVO', 'Área de Compactación'),
('equip-trituradora', 'Trituradora Industrial', 'TR-001', 'Trituradora', 1000.0, 0, 'OPERATIVO', 'Área de Trituración'),
('equip-balanza-1', 'Balanza Industrial 1', 'BZ-001', 'Balanza', 2000.0, 0, 'OPERATIVO', 'Área de Pesaje'),
('equip-balanza-2', 'Balanza Industrial 2', 'BZ-002', 'Balanza', 2000.0, 0, 'OPERATIVO', 'Área de Pesaje');

INSERT INTO "taxes" (id, name, rate, description, "isActive") VALUES
('tax-iva', 'IVA', 21.0, 'Impuesto al Valor Agregado', true),
('tax-iibb', 'Ingresos Brutos', 3.5, 'Impuesto sobre los Ingresos Brutos', true);

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
-- PASO 8: CREAR USUARIOS DE PRUEBA
-- ============================================
-- Generar UUIDs para los usuarios
DO $$
DECLARE
    admin_id TEXT := gen_random_uuid()::text;
    super_id TEXT := gen_random_uuid()::text;
    oper_id TEXT := gen_random_uuid()::text;
    conta_id TEXT := gen_random_uuid()::text;
BEGIN
    -- Insertar usuarios directamente en public.users
    INSERT INTO public.users (id, email, password, name, role, "isActive") VALUES
    (admin_id, 'admin@recicladora.com', 'supabase_auth', 'Administrador', 'ADMIN', true),
    (super_id, 'supervisor@recicladora.com', 'supabase_auth', 'Supervisor', 'SUPERVISOR', true),
    (oper_id, 'operador@recicladora.com', 'supabase_auth', 'Operador', 'OPERADOR', true),
    (conta_id, 'contador@recicladora.com', 'supabase_auth', 'Contador', 'CONTADOR', true);
    
    -- Mostrar los IDs generados para referencia
    RAISE NOTICE 'Usuario Admin creado con ID: %', admin_id;
    RAISE NOTICE 'Usuario Supervisor creado con ID: %', super_id;
    RAISE NOTICE 'Usuario Operador creado con ID: %', oper_id;
    RAISE NOTICE 'Usuario Contador creado con ID: %', conta_id;
    
    RAISE NOTICE '';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'AHORA VE A LA UI DE SUPABASE AUTH:';
    RAISE NOTICE 'https://app.supabase.com/project/hxpzzovirldbtlywdmnk/auth/users';
    RAISE NOTICE '';
    RAISE NOTICE 'Crea estos usuarios con estos emails y contraseñas:';
    RAISE NOTICE '1. admin@recicladora.com - Password: admin123';
    RAISE NOTICE '2. supervisor@recicladora.com - Password: super123';
    RAISE NOTICE '3. operador@recicladora.com - Password: oper123';
    RAISE NOTICE '4. contador@recicladora.com - Password: conta123';
    RAISE NOTICE '==========================================';
END $$;

-- ============================================
-- VERIFICACIÓN FINAL
-- ============================================
SELECT 
    'MIGRACIÓN COMPLETADA' as status,
    COUNT(*) as total_usuarios 
FROM public.users;
