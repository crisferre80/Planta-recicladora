-- ============================================
-- INVENTARIO DE PLANTA INDUSTRIAL
-- Mobiliario, Maquinaria y Equipamiento
-- Ejecutar en SQL Editor de Supabase
-- ============================================

CREATE TABLE IF NOT EXISTS "inventory_items" (
  "id"             TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "name"           TEXT NOT NULL,
  "description"    TEXT,
  "category"       TEXT NOT NULL DEFAULT 'OTRO',
  -- MAQUINARIA | MOBILIARIO | HERRAMIENTA | VEHICULO | ELECTRONICO | INFRAESTRUCTURA | OTRO
  "serialNumber"   TEXT UNIQUE,
  "brand"          TEXT,
  "model"          TEXT,
  "location"       TEXT,
  "status"         TEXT NOT NULL DEFAULT 'OPERATIVO',
  -- OPERATIVO | EN_REPARACION | FUERA_DE_SERVICIO | BAJA | EN_PRESTAMO
  "purchaseDate"   DATE,
  "purchaseValue"  DOUBLE PRECISION,
  "photoUrl"       TEXT,
  "usageInstructions" TEXT,
  "notes"          TEXT,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "inventory_items_category_idx" ON "inventory_items"("category");
CREATE INDEX IF NOT EXISTS "inventory_items_status_idx"   ON "inventory_items"("status");

ALTER TABLE "inventory_items" DISABLE ROW LEVEL SECURITY;

-- ── HISTORIAL DE MANTENIMIENTO / REPARACIONES ─────────────────────────────────

CREATE TABLE IF NOT EXISTS "inventory_maintenance" (
  "id"          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "itemId"      TEXT NOT NULL REFERENCES "inventory_items"("id") ON DELETE CASCADE,
  "type"        TEXT NOT NULL DEFAULT 'INSPECCION',
  -- MANTENIMIENTO | REPARACION | INSPECCION | LIMPIEZA | CALIBRACION | BAJA
  "description" TEXT NOT NULL,
  "performedBy" TEXT,
  "date"        DATE NOT NULL DEFAULT CURRENT_DATE,
  "cost"        DOUBLE PRECISION,
  "status"      TEXT NOT NULL DEFAULT 'COMPLETADO',
  -- PENDIENTE | EN_CURSO | COMPLETADO
  "notes"       TEXT,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "inventory_maintenance_itemId_idx" ON "inventory_maintenance"("itemId");
CREATE INDEX IF NOT EXISTS "inventory_maintenance_date_idx"   ON "inventory_maintenance"("date");

ALTER TABLE "inventory_maintenance" DISABLE ROW LEVEL SECURITY;
