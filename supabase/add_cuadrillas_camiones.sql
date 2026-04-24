-- ============================================
-- FASE 1: Ingreso de Camiones
-- FASE 2: Cuadrillas de Trabajo
-- FASE 3: Progreso por Zonas
-- Ejecutar en SQL Editor de Supabase
-- ============================================

-- ── FASE 1: INGRESO DE CAMIONES ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "truck_entries" (
  "id"               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "entryTime"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "truckPlate"       TEXT NOT NULL,
  "grossWeight"      DOUBLE PRECISION NOT NULL,
  "tareWeight"       DOUBLE PRECISION NOT NULL,
  "netWeight"        DOUBLE PRECISION GENERATED ALWAYS AS ("grossWeight" - "tareWeight") STORED,
  "materialCategory" TEXT NOT NULL DEFAULT 'MIXTO',
  "originZone"       TEXT,
  "operatorId"       TEXT REFERENCES "employees"("id") ON DELETE SET NULL,
  "notes"            TEXT,
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "truck_entries_entryTime_idx" ON "truck_entries"("entryTime");
CREATE INDEX IF NOT EXISTS "truck_entries_materialCategory_idx" ON "truck_entries"("materialCategory");

ALTER TABLE "truck_entries" DISABLE ROW LEVEL SECURITY;

-- ── FASE 2: CUADRILLAS DE TRABAJO ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "work_teams" (
  "id"           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "name"         TEXT NOT NULL,
  "supervisorId" TEXT REFERENCES "employees"("id") ON DELETE SET NULL,
  "zone"         TEXT NOT NULL DEFAULT 'C',
  "isActive"     BOOLEAN NOT NULL DEFAULT true,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "team_members" (
  "id"         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "teamId"     TEXT NOT NULL REFERENCES "work_teams"("id") ON DELETE CASCADE,
  "employeeId" TEXT NOT NULL REFERENCES "employees"("id") ON DELETE CASCADE,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("teamId", "employeeId")
);

CREATE TABLE IF NOT EXISTS "daily_tasks" (
  "id"               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "teamId"           TEXT NOT NULL REFERENCES "work_teams"("id") ON DELETE CASCADE,
  "date"             DATE NOT NULL DEFAULT CURRENT_DATE,
  "zone"             TEXT NOT NULL,
  "materialPriority" TEXT NOT NULL DEFAULT 'MIXTO',
  "targetArea"       DOUBLE PRECISION,
  "completedArea"    DOUBLE PRECISION NOT NULL DEFAULT 0,
  "status"           TEXT NOT NULL DEFAULT 'PENDIENTE',
  "notes"            TEXT,
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "daily_tasks_date_idx"   ON "daily_tasks"("date");
CREATE INDEX IF NOT EXISTS "daily_tasks_teamId_idx" ON "daily_tasks"("teamId");

ALTER TABLE "work_teams"   DISABLE ROW LEVEL SECURITY;
ALTER TABLE "team_members" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "daily_tasks"  DISABLE ROW LEVEL SECURITY;

-- ── FASE 3: PROGRESO DE ZONAS ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "zone_progress" (
  "id"          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "zone"        TEXT NOT NULL,
  "date"        DATE NOT NULL DEFAULT CURRENT_DATE,
  "cleanedArea" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "phase"       INTEGER NOT NULL DEFAULT 1,
  "status"      TEXT NOT NULL DEFAULT 'ACTIVO',
  "notes"       TEXT,
  "teamId"      TEXT REFERENCES "work_teams"("id") ON DELETE SET NULL,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("zone", "date")
);

ALTER TABLE "zone_progress" DISABLE ROW LEVEL SECURITY;

-- ── DATOS INICIALES: 3 Cuadrillas ────────────────────────────────────────────
INSERT INTO "work_teams" ("id", "name", "zone", "isActive")
SELECT gen_random_uuid()::text, 'Cuadrilla A', 'C', true
WHERE NOT EXISTS (SELECT 1 FROM "work_teams" WHERE "name" = 'Cuadrilla A');

INSERT INTO "work_teams" ("id", "name", "zone", "isActive")
SELECT gen_random_uuid()::text, 'Cuadrilla B', 'B', true
WHERE NOT EXISTS (SELECT 1 FROM "work_teams" WHERE "name" = 'Cuadrilla B');

INSERT INTO "work_teams" ("id", "name", "zone", "isActive")
SELECT gen_random_uuid()::text, 'Cuadrilla C', 'A', false
WHERE NOT EXISTS (SELECT 1 FROM "work_teams" WHERE "name" = 'Cuadrilla C');
