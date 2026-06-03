-- Corrige 4 vínculos padre que fallan por datos erróneos en Excel (parte 4 original).
-- Ejecutar en Supabase después de parte 4 si no regeneraste parte_4.
-- Los contratos 187-2025 y 194-2025 siguen sin padre: falta interadmin 364-2025 en el Excel.

BEGIN;

UPDATE contracts SET parent_contract_id = (
  SELECT id FROM contracts WHERE contract_number = '140-2024' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1
) WHERE id = '71ca40fa-96df-49d9-a123-bfd8109bebdf';  -- 138-2024 (Excel decía 286-2024)

UPDATE contracts SET parent_contract_id = (
  SELECT id FROM contracts WHERE contract_number = '1395-2024' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1
) WHERE id = '4c876b08-ac76-4900-b3d4-b8a37d8019b5';  -- 154-2024 (PROYECTO copió 154)

UPDATE contracts SET parent_contract_id = (
  SELECT id FROM contracts WHERE contract_number = '02257-2025' AND contract_type = 'INTERADMINISTRATIVO' LIMIT 1
) WHERE id IN (
  '0b50b530-3bad-49b2-b9a6-24994b6bdeeb',  -- 2257-206-2025
  'c3053be7-be2f-430f-98fa-378997a63a3d'   -- 2257-208-2025
);

COMMIT;

SELECT contract_number, parent_contract_id IS NOT NULL AS tiene_padre
FROM contracts
WHERE contract_number IN ('138-2024','154-2024','2257-206-2025','2257-208-2025','187-2025','194-2025')
ORDER BY contract_number;
