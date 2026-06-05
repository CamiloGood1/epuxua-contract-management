-- PASO 2 de 2 — Ejecutar después de EPUXUA_CONTRACT_HIERARCHY_1_ENUM.sql

UPDATE contracts
SET contract_type = 'DERIVADO',
    resource_type = NULL
WHERE parent_contract_id IS NOT NULL
  AND contract_type = 'DIRECTO';

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

SELECT contract_type, COUNT(*) FROM contracts GROUP BY 1 ORDER BY 1;
SELECT COUNT(*) AS derivados_con_padre FROM contracts WHERE contract_type = 'DERIVADO';
SELECT COUNT(*) AS funcionamiento FROM contracts WHERE contract_type = 'DIRECTO';
