-- Corrección jerarquía contractual (ejecutar en Supabase si ya importaste datos).
-- Regla de negocio:
--   · Hoja Interadministrativos → contract_type = INTERADMINISTRATIVO
--   · Hoja Contratación, Proyecto = número → DERIVADO + parent_contract_id
--   · Hoja Contratación, Proyecto = texto → DIRECTO (funcionamiento EPUXUA)

ALTER TYPE contract_type_enum ADD VALUE IF NOT EXISTS 'DERIVADO';

-- Reclasificar hijos ya importados como DIRECTO
UPDATE contracts
SET contract_type = 'DERIVADO',
    resource_type = NULL
WHERE parent_contract_id IS NOT NULL
  AND contract_type = 'DIRECTO';

-- Vista de derivados (incluye secretaría del padre)
CREATE OR REPLACE VIEW v_derived_contracts AS
SELECT
  c.parent_contract_id,
  c.id,
  c.contract_number,
  c.year,
  c.contract_type,
  c.object,
  c.contract_class,
  c.status,
  c.initial_value + c.total_additions_value   AS final_value,
  c.paid_value,
  c.start_date,
  c.end_date,
  co.full_name                                AS contractor_name,
  s.full_name                                 AS supervisor_name,
  pc.contract_number                          AS parent_contract_number,
  icd.secretaria                              AS parent_secretaria
FROM contracts c
JOIN contractors co  ON c.contractor_id = co.id
LEFT JOIN supervisors s ON c.supervisor_id = s.id
LEFT JOIN contracts pc ON c.parent_contract_id = pc.id
LEFT JOIN interadmin_contract_details icd ON icd.contract_id = pc.id
WHERE c.contract_type = 'DERIVADO'
   OR c.parent_contract_id IS NOT NULL;

GRANT SELECT ON v_derived_contracts TO authenticated;

-- Verificación
SELECT contract_type, COUNT(*) FROM contracts GROUP BY 1 ORDER BY 1;
SELECT COUNT(*) AS derivados_con_padre FROM contracts WHERE contract_type = 'DERIVADO';
SELECT COUNT(*) AS funcionamiento FROM contracts WHERE contract_type = 'DIRECTO';
