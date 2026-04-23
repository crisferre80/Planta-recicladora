-- Hacer el campo equipmentId opcional en production_records
-- Ejecutar en el SQL Editor de Supabase

ALTER TABLE production_records 
ALTER COLUMN "equipmentId" DROP NOT NULL;

-- Verificar que se aplicó el cambio
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'production_records' 
    AND column_name = 'equipmentId';
