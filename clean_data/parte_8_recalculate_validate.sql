-- ==========================================================
-- PARTE 8: RECALCULAR TOTALES + VALIDACIÓN FINAL
-- ==========================================================

BEGIN;


-- Recalcular paid_value
UPDATE contracts c
SET paid_value = COALESCE((
  SELECT SUM(gross_value - deductions) FROM payments WHERE contract_id = c.id
), 0)
WHERE EXISTS (SELECT 1 FROM payments WHERE contract_id = c.id);

-- Recalcular total_additions_value
UPDATE contracts c
SET total_additions_value = COALESCE((
  SELECT SUM(amendment_value) FROM contract_amendments WHERE contract_id = c.id
), 0)
WHERE EXISTS (SELECT 1 FROM contract_amendments WHERE contract_id = c.id);

-- Actualizar end_date con la última prórroga
UPDATE contracts c
SET end_date = sub.new_end_date
FROM (
  SELECT DISTINCT ON (contract_id) contract_id, new_end_date
  FROM contract_extensions
  WHERE new_end_date IS NOT NULL
  ORDER BY contract_id, extension_number DESC
) sub
WHERE c.id = sub.contract_id;

COMMIT;

-- ── VALIDACIÓN FINAL ───────────────────────────────────────────
SELECT tabla, total, esperado,
  CASE WHEN total = esperado THEN '✅ OK' ELSE '❌ REVISAR' END AS estado
FROM (VALUES
  ('supervisors',              (SELECT COUNT(*) FROM supervisors)::int,              57),
  ('contractors',              (SELECT COUNT(*) FROM contractors)::int,             480),
  ('contracts',                (SELECT COUNT(*) FROM contracts)::int,               793),
  ('contratos DIRECTO',        (SELECT COUNT(*) FROM contracts WHERE contract_type = 'DIRECTO')::int,              443),
  ('contratos DERIVADO',       (SELECT COUNT(*) FROM contracts WHERE contract_type = 'DERIVADO')::int,             174),
  ('contratos INTERADMIN',     (SELECT COUNT(*) FROM contracts WHERE contract_type = 'INTERADMINISTRATIVO')::int,   65),
  ('contratos TIENDA_VIRTUAL', (SELECT COUNT(*) FROM contracts WHERE contract_type = 'TIENDA_VIRTUAL')::int,        35),
  ('contratos PAGO_FACTURA',   (SELECT COUNT(*) FROM contracts WHERE contract_type = 'PAGO_FACTURA')::int,          76),
  ('contratos con padre',      (SELECT COUNT(*) FROM contracts WHERE parent_contract_id IS NOT NULL)::int,         172),
  ('interadmin_details',       (SELECT COUNT(*) FROM interadmin_contract_details)::int,                             65),
  ('invoice_details',          (SELECT COUNT(*) FROM invoice_payment_details)::int,                                 76),
  ('budget_commitments',       (SELECT COUNT(*) FROM budget_commitments)::int,                                    1239),
  ('amendments',               (SELECT COUNT(*) FROM contract_amendments)::int,                                    158),
  ('extensions',               (SELECT COUNT(*) FROM contract_extensions)::int,                                    224),
  ('policies',                 (SELECT COUNT(*) FROM contract_policies)::int,                                       75),
  ('mipymes_stats',            (SELECT COUNT(*) FROM mipymes_stats)::int,                                          100),
  ('payments',                 (SELECT COUNT(*) FROM payments)::int,                                              1148)
) AS t(tabla, total, esperado)
ORDER BY tabla;
