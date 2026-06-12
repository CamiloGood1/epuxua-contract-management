-- Parche: corregir recursión infinita en trigger de fuentes de financiación
-- Ejecutar si ya corrió MIGRATION_FUENTES_FINANCIACION.sql sin el fix

CREATE OR REPLACE FUNCTION recalc_funding_source_percentages(p_group_id BIGINT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total NUMERIC;
BEGIN
  IF current_setting('app.recalc_funding', true) = '1' THEN
    RETURN;
  END IF;

  PERFORM set_config('app.recalc_funding', '1', true);

  SELECT total_value INTO v_total
  FROM interadmin_funding_groups
  WHERE id = p_group_id;

  IF v_total IS NULL OR v_total <= 0 THEN
    UPDATE interadmin_funding_sources
    SET participation_percentage = 0, updated_at = NOW()
    WHERE funding_group_id = p_group_id;
  ELSE
    UPDATE interadmin_funding_sources
    SET
      participation_percentage = ROUND((source_value / v_total) * 100, 4),
      updated_at = NOW()
    WHERE funding_group_id = p_group_id;
  END IF;

  PERFORM set_config('app.recalc_funding', '0', true);
END;
$$;

CREATE OR REPLACE FUNCTION trg_recalc_funding_percentages()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_group_id BIGINT;
BEGIN
  IF current_setting('app.recalc_funding', true) = '1' THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  v_group_id := COALESCE(NEW.funding_group_id, OLD.funding_group_id);
  PERFORM recalc_funding_source_percentages(v_group_id);
  RETURN COALESCE(NEW, OLD);
END;
$$;

SELECT 'Trigger de fuentes corregido' AS status;
