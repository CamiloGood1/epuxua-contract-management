-- ============================================================
-- EPUXUA — DDL FINAL PRODUCCIÓN PARA SUPABASE
-- Versión 2.0 | 2026-06-02
-- Fuente: análisis exclusivo de "Contratación Epuxua E.I.C.E.xlsx"
-- ============================================================
-- Orden de ejecución:
--   1. Extensiones
--   2. Tipos (ENUMs)
--   3. Funciones utilitarias
--   4. Catálogos
--   5. PAA
--   6. Contratos (tabla maestra unificada)
--   7. Tablas hijo de contratos
--   8. Módulo de seguimiento
--   9. Documentos
--  10. Usuarios y roles
--  11. Auditoría
--  12. Vistas
--  13. RLS
--  14. Datos iniciales
-- ============================================================

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 1. EXTENSIONES
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 2. ENUMS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Tipo de instrumento contractual
-- DIRECTO        → contratos de funcionamiento EPUXUA (hoja Contratación, col. Proyecto = texto)
-- DERIVADO       → contratos de ejecución vinculados a un interadmin (Proyecto = nro. padre)
-- INTERADMIN     → hoja Contratos Interadministrativos (mandato con Secretarías)
-- TIENDA_VIRTUAL → Acuerdo Marco / Colombia Compra Eficiente
-- PAGO_FACTURA   → adquisición menor aprobada por comité, sin contrato formal
CREATE TYPE contract_type_enum AS ENUM (
  'DIRECTO',
  'DERIVADO',
  'INTERADMINISTRATIVO',
  'TIENDA_VIRTUAL',
  'PAGO_FACTURA'
);

-- Modalidad de selección (normalizado desde 15+ variantes del Excel)
CREATE TYPE selection_modality_enum AS ENUM (
  'CONTRATACION_DIRECTA',
  'INVITACION_ABIERTA',
  'INVITACION_PRESELECCIONADOS',
  'CONCURSO_MERITOS',
  'ORDEN_COMPRA',
  'ACUERDO_MARCO',
  'TIENDA_VIRTUAL',
  'PAGO_FACTURA'
);

-- Estado contractual (normalizado desde 27+ variantes del Excel)
CREATE TYPE contract_status_enum AS ENUM (
  'EN_EJECUCION',
  'SUSPENDIDO',
  'TERMINADO',
  'TERMINADO_ANTICIPADAMENTE',
  'LIQUIDADO',
  'CIERRE_CONTRACTUAL',
  'DECLARADO_FALLIDO',
  'ACTA_NO_EJECUCION',
  'NO_SUSCRIPCION'
);

-- Roles de usuario
CREATE TYPE user_role_enum AS ENUM (
  'ADMIN',
  'GERENTE',
  'ESPECTADOR'
);

-- Tipo de compromiso presupuestal
CREATE TYPE commitment_type_enum AS ENUM ('CDP', 'CRP');

-- Clasificación documental
CREATE TYPE document_type_enum AS ENUM (
  'CONTRATO',
  'POLIZA',
  'ACTA_INICIO',
  'ACTA_SEGUIMIENTO',
  'ACTA_SUSPENSION',
  'ACTA_REINICIO',
  'ADICION',
  'PRORROGA',
  'ACTA_LIQUIDACION',
  'INFORME_SUPERVISOR',
  'CDP',
  'CRP',
  'FICHA_TECNICA',
  'OTRO'
);

-- Semáforo de alerta en seguimiento
CREATE TYPE followup_alert_enum AS ENUM (
  'VERDE',
  'AMARILLO',
  'ROJO'
);

-- Acción de auditoría
CREATE TYPE audit_action_enum AS ENUM ('INSERT', 'UPDATE', 'DELETE');

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 3. FUNCIONES UTILITARIAS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Normaliza texto: minúsculas, sin tildes, sin espacios extremos
-- Usada en columnas GENERATED para índices de unicidad
CREATE OR REPLACE FUNCTION normalize_text(input text)
RETURNS text
LANGUAGE sql IMMUTABLE STRICT AS $$
  SELECT regexp_replace(lower(unaccent(trim(input))), '\s+', ' ', 'g');
$$;

-- Actualiza updated_at antes de cada UPDATE
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Rol del usuario autenticado actual.
-- LANGUAGE plpgsql: el cuerpo no se valida al crear la función,
-- evitando error de forward reference a user_profiles.
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS user_role_enum
LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
DECLARE v_role user_role_enum;
BEGIN
  SELECT role INTO v_role FROM user_profiles WHERE id = auth.uid();
  RETURN v_role;
END;
$$;

-- ¿El GERENTE autenticado tiene asignado este contrato?
-- LANGUAGE plpgsql por la misma razón (forward ref a contract_assignments).
CREATE OR REPLACE FUNCTION user_has_contract(p_contract_id uuid)
RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
DECLARE v_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM contract_assignments
    WHERE user_id = auth.uid() AND contract_id = p_contract_id
  ) INTO v_exists;
  RETURN COALESCE(v_exists, false);
END;
$$;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 4. CATÁLOGOS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- ── Áreas responsables internas de EPUXUA ────────────────────
CREATE TABLE responsible_areas (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       varchar(255) NOT NULL,
  norm_name  varchar(255) GENERATED ALWAYS AS (normalize_text(name)) STORED,
  active     boolean     NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_responsible_areas UNIQUE (norm_name)
);

CREATE INDEX idx_ra_norm ON responsible_areas (norm_name);

-- ── Supervisores internos de EPUXUA ──────────────────────────
CREATE TABLE supervisors (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name  varchar(255) NOT NULL,
  norm_name  varchar(255) GENERATED ALWAYS AS (normalize_text(full_name)) STORED,
  active     boolean     NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_supervisors UNIQUE (norm_name)
);

CREATE INDEX idx_sup_norm ON supervisors (norm_name);
CREATE INDEX idx_sup_trgm ON supervisors USING gin (norm_name gin_trgm_ops);

-- ── Contratistas y proveedores ────────────────────────────────
-- La unicidad real es por document_number cuando existe.
-- Para registros 2021-2024 sin CC/NIT, la PK es suficiente.
CREATE TABLE contractors (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  document_number varchar(20),
  document_type   varchar(5)  CHECK (document_type IN ('CC','NIT','CE','PAS')),
  full_name       varchar(255) NOT NULL,
  norm_name       varchar(255) GENERATED ALWAYS AS (normalize_text(full_name)) STORED,
  person_type     varchar(10) NOT NULL CHECK (person_type IN ('NATURAL','JURIDICA')),
  active          boolean     NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
  -- Unicidad solo cuando hay documento: ver índice parcial abajo.
  -- NUNCA usar UNIQUE NULLS NOT DISTINCT aquí: todos los contratistas
  -- sin CC/NIT colisionarían entre sí (385 de 485 no tienen documento).
);

-- Índice parcial: único SOLO cuando document_number existe.
-- Contratistas sin documento (CC/NIT) no compiten entre sí.
CREATE UNIQUE INDEX uq_contractors_document
  ON contractors (document_number, document_type)
  WHERE document_number IS NOT NULL;

CREATE INDEX idx_con_document ON contractors (document_number) WHERE document_number IS NOT NULL;
CREATE INDEX idx_con_norm     ON contractors (norm_name);
CREATE INDEX idx_con_trgm     ON contractors USING gin (norm_name gin_trgm_ops);

CREATE TRIGGER trg_contractors_upd
  BEFORE UPDATE ON contractors
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 5. PAA — Plan Anual de Adquisiciones
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE paa_lines (
  id                       uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  paa_code                 varchar(20) NOT NULL,
  year                     smallint    NOT NULL CHECK (year BETWEEN 2020 AND 2099),
  unspsc_codes             varchar(255),
  description              text        NOT NULL,
  estimated_start_month    smallint    CHECK (estimated_start_month BETWEEN 1 AND 12),
  duration_number          smallint,
  duration_interval        varchar(20) CHECK (duration_interval IN ('dias','meses','años')),
  selection_modality       varchar(100),
  resource_source          varchar(100),
  estimated_total_value    numeric(18,2),
  estimated_current_value  numeric(18,2),
  requires_future_validity boolean     NOT NULL DEFAULT false,
  responsible_name         varchar(255),
  responsible_phone        varchar(30),
  responsible_email        varchar(255),
  location                 varchar(100),
  observations             text,
  created_at               timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_paa_code_year UNIQUE (paa_code, year)
);

CREATE INDEX idx_paa_year ON paa_lines (year);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 6. CONTRACTS — tabla maestra unificada
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Unifica: contratos directos + interadministrativos +
--          tienda virtual + pago contra factura
-- Diferenciados por contract_type.
-- Justificación de unificación:
--   • Tienda Virtual comparte el 95% de columnas con contratos directos
--   • Pago contra Factura comparte el 80% (4 campos únicos → tabla 1:1)
--   • Una sola entidad simplifica vistas, alertas, seguimiento y reportes
--   • El frontend ya trata todos como "contratos" en el listado

CREATE TABLE contracts (
  id                       uuid                    PRIMARY KEY DEFAULT gen_random_uuid(),

  -- ── Identificación ──────────────────────────────────────────
  contract_number          varchar(30)             NOT NULL,
  -- Para TV: número de orden (ej "79548"). Para PCF: "PF-001-2024"
  selection_process_number varchar(50),
  year                     smallint                NOT NULL CHECK (year BETWEEN 2020 AND 2099),
  contract_type            contract_type_enum      NOT NULL DEFAULT 'DIRECTO',
  selection_modality       selection_modality_enum NOT NULL DEFAULT 'CONTRATACION_DIRECTA',
  contract_class           varchar(100)            NOT NULL,
  -- Recurso presupuestal: "FUNCIONAMIENTO", "GASTO DE OPERACIÓN COMERCIAL"
  resource_type            varchar(80),

  -- ── Jerarquía contractual ────────────────────────────────────
  -- contract_type = DERIVADO + parent_contract_id → hijo de interadministrativo.
  -- Fuente: hoja Contratación, columna "Proyecto" = nro. interadmin (ej. 3437-2021).
  -- contract_type = DIRECTO sin padre → funcionamiento u otros recursos EPUXUA.
  parent_contract_id       uuid                    REFERENCES contracts(id),

  -- ── Partes ──────────────────────────────────────────────────
  contractor_id            uuid                    NOT NULL REFERENCES contractors(id),
  supervisor_id            uuid                    REFERENCES supervisors(id),
  responsible_area_id      uuid                    REFERENCES responsible_areas(id),
  paa_line_id              uuid                    REFERENCES paa_lines(id),

  -- ── Descripción ─────────────────────────────────────────────
  object                   text                    NOT NULL,

  -- ── Fechas ──────────────────────────────────────────────────
  subscription_date        date                    NOT NULL,
  publication_date         date,                   -- Publicación SECOP (desde 2025)
  start_date               date,
  -- Plazo en texto original (ej: "4 MESES", "65 dias") — no normalizable automáticamente
  initial_term_text        varchar(150),
  -- Días calculados manualmente durante migración
  initial_term_days        integer     CHECK (initial_term_days > 0),
  end_date                 date,
  liquidation_date         date,
  file_closure_date        date,

  -- ── Valores financieros ──────────────────────────────────────
  monthly_value            numeric(18,2),           -- desde 2025
  initial_value            numeric(18,2)            NOT NULL CHECK (initial_value >= 0),
  -- Mantenido por trigger en contract_amendments
  total_additions_value    numeric(18,2)            NOT NULL DEFAULT 0,
  -- Mantenido por trigger en payments
  paid_value               numeric(18,2)            NOT NULL DEFAULT 0,
  future_validity          numeric(18,2)            NOT NULL DEFAULT 0,

  -- ── Estado ──────────────────────────────────────────────────
  status                   contract_status_enum     NOT NULL DEFAULT 'EN_EJECUCION',

  -- ── Documentos externos ─────────────────────────────────────
  secop_url                text,
  technical_file_url       text,

  -- ── Extras ──────────────────────────────────────────────────
  interventor              varchar(255),            -- desde 2025
  observations             text,

  -- ── Auditoría ────────────────────────────────────────────────
  created_at               timestamptz             NOT NULL DEFAULT now(),
  updated_at               timestamptz             NOT NULL DEFAULT now(),

  CONSTRAINT uq_contract_number_year_type UNIQUE (contract_number, year, contract_type)
);

-- Índices operacionales
CREATE INDEX idx_con_number       ON contracts (contract_number);
CREATE INDEX idx_con_year         ON contracts (year);
CREATE INDEX idx_con_type         ON contracts (contract_type);
CREATE INDEX idx_con_status       ON contracts (status);
CREATE INDEX idx_con_contractor   ON contracts (contractor_id);
CREATE INDEX idx_con_supervisor   ON contracts (supervisor_id);
CREATE INDEX idx_con_area         ON contracts (responsible_area_id);
CREATE INDEX idx_con_parent       ON contracts (parent_contract_id) WHERE parent_contract_id IS NOT NULL;
-- Índice parcial para alertas de vencimiento (solo activos con fecha fin)
CREATE INDEX idx_con_end_active   ON contracts (end_date, status)
  WHERE status IN ('EN_EJECUCION','SUSPENDIDO') AND end_date IS NOT NULL;
-- Índice parcial para el dashboard (solo contratos activos)
CREATE INDEX idx_con_active_year  ON contracts (year, responsible_area_id)
  WHERE status = 'EN_EJECUCION';

CREATE TRIGGER trg_contracts_upd
  BEFORE UPDATE ON contracts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 7. TABLAS HIJO DE CONTRACTS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- ── Detalles específicos de contratos interadministrativos ────
-- Cuota de Administración = honorarios de EPUXUA por gestionar el contrato
-- Bolsa de Mandato = recursos transferidos para ejecutar la obra/servicio
CREATE TABLE interadmin_contract_details (
  id                      uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id             uuid        NOT NULL UNIQUE REFERENCES contracts(id) ON DELETE CASCADE,
  secretaria              varchar(255) NOT NULL,
  admin_fee_initial       numeric(18,2) NOT NULL DEFAULT 0,
  admin_fee_additions     numeric(18,2) NOT NULL DEFAULT 0,
  mandate_pool_initial    numeric(18,2) NOT NULL DEFAULT 0,
  mandate_pool_additions  numeric(18,2) NOT NULL DEFAULT 0,
  pending_collection      numeric(18,2) NOT NULL DEFAULT 0,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_interadmin_upd
  BEFORE UPDATE ON interadmin_contract_details
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Detalles específicos de Pago contra Factura ───────────────
-- Los 4 campos únicos de PCF que no existen en otros tipos de contrato
CREATE TABLE invoice_payment_details (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id         uuid        NOT NULL UNIQUE REFERENCES contracts(id) ON DELETE CASCADE,
  committee_number    varchar(50),
  committee_act_info  text,       -- "Acta N°X del DD/MM/YYYY"
  invoice_date        date,
  requesting_officer  varchar(255),
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- ── CDP / CRP por contrato ────────────────────────────────────
CREATE TABLE budget_commitments (
  id               uuid                 PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id      uuid                 NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  commitment_type  commitment_type_enum NOT NULL,
  number           varchar(50)          NOT NULL,   -- "DIS-2026000001"
  value            numeric(18,2)        NOT NULL CHECK (value >= 0),
  budget_code      varchar(120),                    -- "2.1.2.02.02.008.002"
  date             date,                            -- nullable: algunos CDP/CRP del Excel no tienen fecha
  is_addition      boolean              NOT NULL DEFAULT false,
  created_at       timestamptz          NOT NULL DEFAULT now(),
  CONSTRAINT uq_budget_commitment UNIQUE (contract_id, commitment_type, number)
);

CREATE INDEX idx_bc_contract ON budget_commitments (contract_id);
CREATE INDEX idx_bc_number   ON budget_commitments (number);

-- ── Adiciones de valor ────────────────────────────────────────
CREATE TABLE contract_amendments (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id       uuid        NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  amendment_number  smallint    NOT NULL DEFAULT 1,
  modification_type varchar(50) NOT NULL DEFAULT 'ADICION',  -- 'ADICION', 'MODIFICACION'
  amendment_value   numeric(18,2) NOT NULL,
  amendment_date    date,
  -- CDP de la adición
  cdp_number        varchar(50),
  cdp_value         numeric(18,2),
  cdp_date          date,
  cdp_budget_code   varchar(120),
  -- CRP de la adición
  crp_number        varchar(50),
  crp_value         numeric(18,2),
  crp_date          date,
  crp_budget_code   varchar(120),
  observations      text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_amendment UNIQUE (contract_id, amendment_number)
);

CREATE INDEX idx_amend_contract ON contract_amendments (contract_id);

-- Trigger: mantiene contracts.total_additions_value sincronizado
CREATE OR REPLACE FUNCTION sync_additions_value()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE v_cid uuid;
BEGIN
  v_cid := COALESCE(NEW.contract_id, OLD.contract_id);
  UPDATE contracts
  SET total_additions_value = COALESCE((
    SELECT SUM(amendment_value) FROM contract_amendments WHERE contract_id = v_cid
  ), 0)
  WHERE id = v_cid;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_additions
  AFTER INSERT OR UPDATE OR DELETE ON contract_amendments
  FOR EACH ROW EXECUTE FUNCTION sync_additions_value();

-- ── Prórrogas ─────────────────────────────────────────────────
CREATE TABLE contract_extensions (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id         uuid        NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  extension_number    smallint    NOT NULL DEFAULT 1,
  -- Texto original del Excel (ej: "UN (1) MES Y DIECISEIS (16) DIAS")
  extension_term_text varchar(200),
  extension_term_days integer     CHECK (extension_term_days > 0),
  extension_date      date,
  new_end_date        date,
  observations        text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_extension UNIQUE (contract_id, extension_number)
);

CREATE INDEX idx_ext_contract ON contract_extensions (contract_id);

-- Trigger: actualiza contracts.end_date con la fecha de la última prórroga
CREATE OR REPLACE FUNCTION sync_end_date()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_cid      uuid;
  v_end_date date;
BEGIN
  v_cid := COALESCE(NEW.contract_id, OLD.contract_id);
  SELECT new_end_date INTO v_end_date
  FROM contract_extensions
  WHERE contract_id = v_cid AND new_end_date IS NOT NULL
  ORDER BY extension_number DESC LIMIT 1;
  IF v_end_date IS NOT NULL THEN
    UPDATE contracts SET end_date = v_end_date WHERE id = v_cid;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_end_date
  AFTER INSERT OR UPDATE ON contract_extensions
  FOR EACH ROW EXECUTE FUNCTION sync_end_date();

-- ── Suspensiones ──────────────────────────────────────────────
CREATE TABLE contract_suspensions (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id          uuid        NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  suspension_number    smallint    NOT NULL DEFAULT 1,
  suspension_date      date        NOT NULL,
  suspension_term_text varchar(200),
  suspension_term_days integer     CHECK (suspension_term_days > 0),
  restart_date         date,
  observations         text,
  created_at           timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_suspension UNIQUE (contract_id, suspension_number)
);

CREATE INDEX idx_sus_contract ON contract_suspensions (contract_id);

-- ── Pólizas de seguro ─────────────────────────────────────────
CREATE TABLE contract_policies (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id    uuid        NOT NULL UNIQUE REFERENCES contracts(id) ON DELETE CASCADE,
  policy_number  varchar(100),
  issuing_entity varchar(255),
  issue_date     date,
  start_date     date,
  end_date       date,
  approval_date  date,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_policies_upd
  BEFORE UPDATE ON contract_policies
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Pagos individuales ────────────────────────────────────────
CREATE TABLE payments (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id           uuid        NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  payment_number        integer     NOT NULL,
  payment_date          date        NOT NULL,
  gross_value           numeric(18,2) NOT NULL CHECK (gross_value >= 0),
  deductions            numeric(18,2) NOT NULL DEFAULT 0 CHECK (deductions >= 0),
  -- net_value = gross_value - deductions (calculado en consulta, no columna física)
  cumulative_percentage numeric(7,4),
  drive_url             text,
  created_at            timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_payment UNIQUE (contract_id, payment_number)
);

CREATE INDEX idx_pay_contract ON payments (contract_id);
CREATE INDEX idx_pay_date     ON payments (payment_date DESC);
CREATE INDEX idx_pay_con_date ON payments (contract_id, payment_date DESC);

-- Trigger: mantiene contracts.paid_value sincronizado (neto = bruto - descuentos)
CREATE OR REPLACE FUNCTION sync_paid_value()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE v_cid uuid;
BEGIN
  v_cid := COALESCE(NEW.contract_id, OLD.contract_id);
  UPDATE contracts
  SET paid_value = COALESCE((
    SELECT SUM(gross_value - deductions) FROM payments WHERE contract_id = v_cid
  ), 0)
  WHERE id = v_cid;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_paid
  AFTER INSERT OR UPDATE OR DELETE ON payments
  FOR EACH ROW EXECUTE FUNCTION sync_paid_value();

-- ── Estadísticas MiPymes (obligatorio desde 2026) ─────────────
CREATE TABLE mipymes_stats (
  id                   uuid     PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id          uuid     NOT NULL UNIQUE REFERENCES contracts(id) ON DELETE CASCADE,
  providers_consulted  smallint,
  mipymes_consulted    smallint,
  providers_presented  smallint,
  mipymes_presented    smallint,
  mipymes_benefited    smallint,
  mipymes_participated boolean,
  limited_to_mipymes   boolean,
  awarded_to_mipymes   boolean,
  created_at           timestamptz NOT NULL DEFAULT now()
);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 8. MÓDULO DE SEGUIMIENTO
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Soporta la pantalla "Seguimiento" del frontend:
-- avance físico, avance financiero, observaciones, riesgos,
-- acciones correctivas, semáforo de alerta, usuario y fecha.

CREATE TABLE contract_followups (
  id                  uuid                PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id         uuid                NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  followup_date       date                NOT NULL DEFAULT CURRENT_DATE,
  -- Período descriptivo: "Mes 3", "Semana 12", "Corte enero 2026"
  period_label        varchar(100),
  -- Avances en porcentaje 0.00–100.00
  physical_progress   numeric(5,2)        CHECK (physical_progress BETWEEN 0 AND 100),
  financial_progress  numeric(5,2)        CHECK (financial_progress BETWEEN 0 AND 100),
  -- Semáforo calculado o asignado manualmente
  alert_level         followup_alert_enum NOT NULL DEFAULT 'VERDE',
  observations        text,
  risks               text,
  corrective_actions  text,
  next_actions        text,
  -- FK a user_profiles agregada con ALTER TABLE después de crear esa tabla
  recorded_by         uuid,
  created_at          timestamptz         NOT NULL DEFAULT now(),
  updated_at          timestamptz         NOT NULL DEFAULT now()
);

CREATE INDEX idx_fup_contract ON contract_followups (contract_id);
CREATE INDEX idx_fup_date     ON contract_followups (contract_id, followup_date DESC);

CREATE TRIGGER trg_followups_upd
  BEFORE UPDATE ON contract_followups
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 9. DOCUMENTOS — integración con Supabase Storage
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Un documento puede pertenecer a:
--   • un contrato (contract_id)
--   • un seguimiento (followup_id)
--   • una adición (amendment_id)
-- Al menos uno debe estar presente (CHECK constraint).

CREATE TABLE documents (
  id            uuid               PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Referencia al objeto padre (al menos uno obligatorio)
  contract_id   uuid               REFERENCES contracts(id) ON DELETE CASCADE,
  followup_id   uuid               REFERENCES contract_followups(id) ON DELETE CASCADE,
  amendment_id  uuid               REFERENCES contract_amendments(id) ON DELETE CASCADE,
  -- Clasificación
  document_type document_type_enum NOT NULL DEFAULT 'OTRO',
  -- Metadatos del archivo
  file_name     varchar(255)       NOT NULL,
  -- Ruta en Supabase Storage (bucket "epuxua-docs")
  -- Formato: {contract_number}/{year}/{document_type}/{uuid}.{ext}
  storage_path  text               NOT NULL,
  file_size     integer            CHECK (file_size > 0),      -- bytes
  mime_type     varchar(100),
  -- FK a user_profiles agregada con ALTER TABLE después de crear esa tabla
  uploaded_by   uuid,
  created_at    timestamptz        NOT NULL DEFAULT now(),
  -- Al menos un padre debe existir
  CONSTRAINT chk_document_parent CHECK (
    contract_id IS NOT NULL OR followup_id IS NOT NULL OR amendment_id IS NOT NULL
  )
);

CREATE INDEX idx_doc_contract  ON documents (contract_id) WHERE contract_id IS NOT NULL;
CREATE INDEX idx_doc_followup  ON documents (followup_id) WHERE followup_id IS NOT NULL;
CREATE INDEX idx_doc_amendment ON documents (amendment_id) WHERE amendment_id IS NOT NULL;
CREATE INDEX idx_doc_type      ON documents (document_type);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 10. USUARIOS Y ROLES
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- id = auth.users.id (generado por Supabase Auth; nunca lo introduce el usuario en la UI)
CREATE TABLE user_profiles (
  id                  uuid           PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name           varchar(255)   NOT NULL,
  role                user_role_enum NOT NULL DEFAULT 'ESPECTADOR',
  responsible_area_id uuid           REFERENCES responsible_areas(id),
  active              boolean        NOT NULL DEFAULT true,
  created_at          timestamptz    NOT NULL DEFAULT now(),
  updated_at          timestamptz    NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_profiles_upd
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Trigger: crea perfil automáticamente al registrar usuario en Supabase Auth
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO user_profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'ESPECTADOR'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Asegura perfil en primer login / sesiones sin trigger (id = auth.uid(), sin UUID manual)
CREATE OR REPLACE FUNCTION ensure_user_profile()
RETURNS user_profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_auth   auth.users%ROWTYPE;
  v_result user_profiles;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;

  SELECT * INTO v_auth FROM auth.users WHERE id = auth.uid();
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Usuario de auth no encontrado';
  END IF;

  INSERT INTO user_profiles (id, full_name, role)
  VALUES (
    v_auth.id,
    COALESCE(v_auth.raw_user_meta_data->>'full_name', v_auth.email),
    'ESPECTADOR'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, user_profiles.full_name),
    updated_at = now();

  SELECT * INTO v_result FROM user_profiles WHERE id = auth.uid();
  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION ensure_user_profile() TO authenticated;

CREATE OR REPLACE FUNCTION backfill_user_profiles_from_auth()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_count integer;
BEGIN
  INSERT INTO user_profiles (id, full_name, role)
  SELECT
    au.id,
    COALESCE(au.raw_user_meta_data->>'full_name', au.email),
    'ESPECTADOR'
  FROM auth.users au
  WHERE NOT EXISTS (
    SELECT 1 FROM user_profiles up WHERE up.id = au.id
  );
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

CREATE OR REPLACE FUNCTION set_user_role_by_email(p_email text, p_role user_role_enum)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_updated integer;
BEGIN
  UPDATE user_profiles up
  SET role = p_role, updated_at = now()
  FROM auth.users au
  WHERE up.id = au.id
    AND lower(trim(au.email)) = lower(trim(p_email));

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$$;

-- Asignación de contratos a gerentes (base del RLS de GERENTE)
CREATE TABLE contract_assignments (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  contract_id uuid        NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  assigned_by uuid        REFERENCES user_profiles(id),
  CONSTRAINT uq_assignment UNIQUE (user_id, contract_id)
);

CREATE INDEX idx_assign_user     ON contract_assignments (user_id);
CREATE INDEX idx_assign_contract ON contract_assignments (contract_id);

-- Bug fix 1 & 2: FKs hacia user_profiles agregadas ahora que la tabla existe
ALTER TABLE contract_followups
  ADD CONSTRAINT fk_followup_recorded_by
  FOREIGN KEY (recorded_by) REFERENCES user_profiles(id) ON DELETE SET NULL;

ALTER TABLE documents
  ADD CONSTRAINT fk_document_uploaded_by
  FOREIGN KEY (uploaded_by) REFERENCES user_profiles(id) ON DELETE SET NULL;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 11. AUDITORÍA — trazabilidad completa
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Registra INSERT / UPDATE / DELETE en las tablas operacionales.
-- Aplica a: contracts, payments, contract_amendments,
--           contract_extensions, contract_suspensions,
--           contract_followups, documents

CREATE TABLE audit_log (
  id             bigserial          PRIMARY KEY,
  table_name     varchar(100)       NOT NULL,
  record_id      uuid               NOT NULL,
  action         audit_action_enum  NOT NULL,
  old_data       jsonb,
  new_data       jsonb,
  changed_fields text[],
  user_id        uuid,              -- auth.uid() al momento del cambio
  user_role      user_role_enum,
  ip_address     inet,
  created_at     timestamptz        NOT NULL DEFAULT now()
);

-- Índices para consultas de historial
CREATE INDEX idx_audit_record    ON audit_log (table_name, record_id);
CREATE INDEX idx_audit_user      ON audit_log (user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_audit_created   ON audit_log (created_at DESC);
-- Particionable por mes si el volumen crece (>1M filas/año)

-- Función de auditoría genérica
CREATE OR REPLACE FUNCTION audit_trigger_fn()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_old    jsonb;
  v_new    jsonb;
  v_fields text[];
  v_rid    uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_old := to_jsonb(OLD);
    v_rid := OLD.id;
    v_new := NULL;
    v_fields := NULL;
  ELSIF TG_OP = 'INSERT' THEN
    v_new := to_jsonb(NEW);
    v_rid := NEW.id;
    v_old := NULL;
    v_fields := NULL;
  ELSE
    v_old := to_jsonb(OLD);
    v_new := to_jsonb(NEW);
    v_rid := NEW.id;
    -- Detectar campos que cambiaron
    SELECT array_agg(key) INTO v_fields
    FROM jsonb_each(v_new)
    WHERE v_new->key IS DISTINCT FROM v_old->key
      AND key NOT IN ('updated_at','created_at');
  END IF;

  INSERT INTO audit_log (
    table_name, record_id, action,
    old_data, new_data, changed_fields,
    user_id, user_role, ip_address
  )
  VALUES (
    TG_TABLE_NAME, v_rid, TG_OP::audit_action_enum,
    v_old, v_new, v_fields,
    auth.uid(),
    (SELECT role FROM user_profiles WHERE id = auth.uid()),
    inet_client_addr()
  );
  -- En AFTER triggers el valor de retorno es ignorado,
  -- pero RETURN NEW falla en DELETE porque NEW es NULL.
  -- COALESCE devuelve OLD en DELETE, NEW en INSERT/UPDATE.
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Aplicar auditoría a las tablas críticas
DO $$
DECLARE tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'contracts',
    'contract_amendments',
    'contract_extensions',
    'contract_suspensions',
    'payments',
    'contract_followups',
    'documents'
  ]
  LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_audit_%s
         AFTER INSERT OR UPDATE OR DELETE ON %I
         FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn();',
      tbl, tbl
    );
  END LOOP;
END;
$$;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 12. VISTAS PARA EL FRONTEND
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- ── v_contract_detail — detalle completo de un contrato ──────
CREATE OR REPLACE VIEW v_contract_detail AS
SELECT
  c.*,
  -- Valores calculados
  c.initial_value + c.total_additions_value       AS final_value,
  (c.initial_value + c.total_additions_value)
    - c.paid_value                                AS pending_value,
  CASE
    WHEN (c.initial_value + c.total_additions_value) > 0
    THEN ROUND(c.paid_value
         / (c.initial_value + c.total_additions_value) * 100, 2)
    ELSE 0
  END                                             AS financial_progress_pct,
  (c.end_date - CURRENT_DATE)::integer            AS days_remaining,
  -- Partes
  co.full_name                                    AS contractor_name,
  co.document_number                              AS contractor_document,
  co.person_type                                  AS contractor_person_type,
  s.full_name                                     AS supervisor_name,
  ra.name                                         AS area_name,
  -- PAA
  pl.paa_code,
  pl.description                                  AS paa_description,
  pl.estimated_total_value                        AS paa_estimated_value,
  -- Interadmin
  icd.secretaria,
  icd.admin_fee_initial,
  icd.admin_fee_additions,
  icd.admin_fee_initial + icd.admin_fee_additions AS admin_fee_total,
  icd.mandate_pool_initial,
  icd.mandate_pool_additions,
  icd.mandate_pool_initial + icd.mandate_pool_additions AS mandate_pool_total,
  icd.pending_collection,
  -- PCF
  ipd.committee_number,
  ipd.committee_act_info,
  ipd.invoice_date,
  ipd.requesting_officer,
  -- Póliza
  cp.policy_number,
  cp.issuing_entity                               AS policy_issuer,
  cp.start_date                                   AS policy_start,
  cp.end_date                                     AS policy_end,
  cp.approval_date                                AS policy_approval,
  -- Contrato padre (contratos derivados)
  pc.contract_number                              AS parent_contract_number
FROM contracts c
JOIN contractors co           ON c.contractor_id = co.id
LEFT JOIN supervisors s       ON c.supervisor_id = s.id
LEFT JOIN responsible_areas ra ON c.responsible_area_id = ra.id
LEFT JOIN paa_lines pl         ON c.paa_line_id = pl.id
LEFT JOIN interadmin_contract_details icd ON icd.contract_id = c.id
LEFT JOIN invoice_payment_details     ipd ON ipd.contract_id = c.id
LEFT JOIN contract_policies           cp  ON cp.contract_id = c.id
LEFT JOIN contracts pc         ON c.parent_contract_id = pc.id;

-- ── v_dashboard_kpis — métricas para el dashboard ────────────
CREATE OR REPLACE VIEW v_dashboard_kpis AS
SELECT
  COUNT(*)                                                             AS total_contracts,
  COUNT(*) FILTER (WHERE status = 'EN_EJECUCION')                      AS active_contracts,
  COUNT(*) FILTER (WHERE status = 'SUSPENDIDO')                        AS suspended_contracts,
  COUNT(*) FILTER (WHERE status = 'LIQUIDADO')                         AS liquidated_contracts,
  COUNT(*) FILTER (WHERE status = 'TERMINADO')                         AS finished_contracts,
  COUNT(*) FILTER (
    WHERE status = 'EN_EJECUCION'
      AND end_date < CURRENT_DATE)                                     AS overdue_active,
  COUNT(*) FILTER (
    WHERE end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 15
      AND status = 'EN_EJECUCION')                                     AS expiring_15_days,
  COUNT(*) FILTER (
    WHERE end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 30
      AND status = 'EN_EJECUCION')                                     AS expiring_30_days,
  COALESCE(SUM(initial_value + total_additions_value), 0)              AS total_final_value,
  COALESCE(SUM(paid_value), 0)                                         AS total_paid_value,
  COALESCE(SUM((initial_value + total_additions_value) - paid_value), 0) AS total_pending_value,
  COALESCE(SUM(initial_value + total_additions_value)
    FILTER (WHERE status = 'EN_EJECUCION'), 0)                         AS active_contracted_value
FROM contracts;

-- ── v_contract_tracking — seguimiento de ejecución ───────────
CREATE OR REPLACE VIEW v_contract_tracking AS
SELECT
  c.id,
  c.contract_number,
  c.year,
  c.contract_type,
  c.object,
  c.status,
  c.start_date,
  c.end_date,
  c.initial_value + c.total_additions_value       AS final_value,
  c.paid_value,
  CASE
    WHEN (c.initial_value + c.total_additions_value) > 0
    THEN ROUND(c.paid_value
         / (c.initial_value + c.total_additions_value) * 100, 2)
    ELSE 0
  END                                             AS financial_progress_pct,
  (c.end_date - CURRENT_DATE)::integer            AS days_remaining,
  -- Avance temporal
  CASE WHEN c.start_date IS NOT NULL AND c.end_date IS NOT NULL
       AND c.end_date > c.start_date
    THEN ROUND(
      EXTRACT(DAY FROM now() - c.start_date::timestamptz) /
      EXTRACT(DAY FROM c.end_date::timestamptz - c.start_date::timestamptz) * 100, 2
    )
    ELSE NULL
  END                                             AS time_progress_pct,
  co.full_name                                    AS contractor_name,
  s.full_name                                     AS supervisor_name,
  ra.name                                         AS area_name,
  -- Último seguimiento registrado
  fup.followup_date                               AS last_followup_date,
  fup.physical_progress                           AS last_physical_progress,
  fup.financial_progress                          AS last_financial_progress,
  fup.alert_level                                 AS last_alert_level,
  -- Pagos
  (SELECT MAX(payment_date) FROM payments WHERE contract_id = c.id) AS last_payment_date,
  (SELECT COUNT(*)::integer FROM payments WHERE contract_id = c.id) AS payment_count
FROM contracts c
JOIN contractors co            ON c.contractor_id = co.id
LEFT JOIN supervisors s        ON c.supervisor_id = s.id
LEFT JOIN responsible_areas ra ON c.responsible_area_id = ra.id
-- Último seguimiento
LEFT JOIN LATERAL (
  SELECT followup_date, physical_progress, financial_progress, alert_level
  FROM contract_followups
  WHERE contract_id = c.id
  ORDER BY followup_date DESC LIMIT 1
) fup ON true;

-- ── v_contract_alerts — alertas de vencimiento ───────────────
CREATE OR REPLACE VIEW v_contract_alerts AS
SELECT
  c.id,
  c.contract_number,
  c.year,
  c.object,
  c.status,
  c.end_date,
  (c.end_date - CURRENT_DATE)::integer            AS days_remaining,
  co.full_name                                    AS contractor_name,
  s.full_name                                     AS supervisor_name,
  ra.name                                         AS area_name,
  CASE
    WHEN c.end_date < CURRENT_DATE                THEN 'VENCIDO'
    WHEN c.end_date <= CURRENT_DATE + 15          THEN 'CRITICO'
    WHEN c.end_date <= CURRENT_DATE + 30          THEN 'ALTO'
    WHEN c.end_date <= CURRENT_DATE + 60          THEN 'MEDIO'
    ELSE 'OK'
  END                                             AS alert_level
FROM contracts c
JOIN contractors co            ON c.contractor_id = co.id
LEFT JOIN supervisors s        ON c.supervisor_id = s.id
LEFT JOIN responsible_areas ra ON c.responsible_area_id = ra.id
WHERE c.status IN ('EN_EJECUCION','SUSPENDIDO')
  AND c.end_date IS NOT NULL;

-- ── v_derived_contracts — hijos de interadministrativos (hoja Contratación)
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

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 13. ROW LEVEL SECURITY
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ALTER TABLE responsible_areas          ENABLE ROW LEVEL SECURITY;
ALTER TABLE supervisors                ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractors                ENABLE ROW LEVEL SECURITY;
ALTER TABLE paa_lines                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE interadmin_contract_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_payment_details    ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_commitments         ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_amendments        ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_extensions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_suspensions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_policies          ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE mipymes_stats              ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_followups         ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_assignments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log                  ENABLE ROW LEVEL SECURITY;

-- ── CATÁLOGOS: lectura para todos, escritura solo ADMIN ───────

CREATE POLICY "cat_select" ON responsible_areas FOR SELECT TO authenticated USING (true);
CREATE POLICY "cat_admin"  ON responsible_areas FOR ALL    TO authenticated
  USING (current_user_role() = 'ADMIN') WITH CHECK (current_user_role() = 'ADMIN');

CREATE POLICY "cat_select" ON supervisors FOR SELECT TO authenticated USING (true);
CREATE POLICY "cat_admin"  ON supervisors FOR ALL    TO authenticated
  USING (current_user_role() = 'ADMIN') WITH CHECK (current_user_role() = 'ADMIN');

CREATE POLICY "cat_select" ON contractors FOR SELECT TO authenticated USING (true);
CREATE POLICY "cat_admin"  ON contractors FOR ALL    TO authenticated
  USING (current_user_role() = 'ADMIN') WITH CHECK (current_user_role() = 'ADMIN');

CREATE POLICY "paa_select" ON paa_lines FOR SELECT TO authenticated USING (true);
CREATE POLICY "paa_admin"  ON paa_lines FOR ALL     TO authenticated
  USING (current_user_role() = 'ADMIN') WITH CHECK (current_user_role() = 'ADMIN');

-- ── CONTRACTS ─────────────────────────────────────────────────

-- Admin: acceso total
CREATE POLICY "con_admin"
  ON contracts FOR ALL TO authenticated
  USING    (current_user_role() = 'ADMIN')
  WITH CHECK (current_user_role() = 'ADMIN');

-- Gerente: solo lectura y escritura de contratos asignados
CREATE POLICY "con_gerente_select"
  ON contracts FOR SELECT TO authenticated
  USING (current_user_role() = 'GERENTE' AND user_has_contract(id));

CREATE POLICY "con_gerente_update"
  ON contracts FOR UPDATE TO authenticated
  USING    (current_user_role() = 'GERENTE' AND user_has_contract(id))
  WITH CHECK (current_user_role() = 'GERENTE' AND user_has_contract(id));

-- Espectador: solo lectura total
CREATE POLICY "con_espectador_select"
  ON contracts FOR SELECT TO authenticated
  USING (current_user_role() = 'ESPECTADOR');

-- ── TABLAS HIJO (con FK contract_id) ─────────────────────────
-- Se aplica a todas las tablas hijas mediante bloque dinámico

DO $$
DECLARE tbl text;
BEGIN
  -- Tablas con contract_id NOT NULL (FK directa, sin nullable)
  FOREACH tbl IN ARRAY ARRAY[
    'interadmin_contract_details',
    'invoice_payment_details',
    'budget_commitments',
    'contract_amendments',
    'contract_extensions',
    'contract_suspensions',
    'contract_policies',
    'payments',
    'mipymes_stats',
    'contract_followups'
  ]
  LOOP
    -- Admin: todo
    EXECUTE format(
      'CREATE POLICY "admin_%1$s" ON %1$I FOR ALL TO authenticated
       USING (current_user_role() = ''ADMIN'')
       WITH CHECK (current_user_role() = ''ADMIN'');', tbl
    );
    -- Gerente: solo contratos asignados
    EXECUTE format(
      'CREATE POLICY "gerente_select_%1$s" ON %1$I FOR SELECT TO authenticated
       USING (current_user_role() = ''GERENTE'' AND user_has_contract(contract_id));', tbl
    );
    EXECUTE format(
      'CREATE POLICY "gerente_insert_%1$s" ON %1$I FOR INSERT TO authenticated
       WITH CHECK (current_user_role() = ''GERENTE'' AND user_has_contract(contract_id));', tbl
    );
    EXECUTE format(
      'CREATE POLICY "gerente_update_%1$s" ON %1$I FOR UPDATE TO authenticated
       USING    (current_user_role() = ''GERENTE'' AND user_has_contract(contract_id))
       WITH CHECK (current_user_role() = ''GERENTE'' AND user_has_contract(contract_id));', tbl
    );
    -- Espectador: solo lectura
    EXECUTE format(
      'CREATE POLICY "espectador_%1$s" ON %1$I FOR SELECT TO authenticated
       USING (current_user_role() = ''ESPECTADOR'');', tbl
    );
  END LOOP;

  -- Bug fix 4: documents tiene contract_id NULLABLE (referencia polimórfica)
  -- user_has_contract(NULL) devuelve false, pero los documentos de seguimientos
  -- sin contract_id directo serían inaccesibles para GERENTE.
  -- Fix: resolver via followup → contract o amendment → contract.
END;
$$;

-- RLS especial para documents (polimórfica: contract_id puede ser NULL)
CREATE POLICY "admin_documents" ON documents FOR ALL TO authenticated
  USING (current_user_role() = 'ADMIN')
  WITH CHECK (current_user_role() = 'ADMIN');

CREATE POLICY "gerente_select_documents" ON documents FOR SELECT TO authenticated
  USING (
    current_user_role() = 'GERENTE'
    AND (
      -- Documento directo de contrato asignado
      (contract_id IS NOT NULL AND user_has_contract(contract_id))
      -- Documento de seguimiento de contrato asignado
      OR (followup_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM contract_followups cf
        WHERE cf.id = followup_id AND user_has_contract(cf.contract_id)
      ))
      -- Documento de adición de contrato asignado
      OR (amendment_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM contract_amendments ca
        WHERE ca.id = amendment_id AND user_has_contract(ca.contract_id)
      ))
    )
  );

CREATE POLICY "gerente_insert_documents" ON documents FOR INSERT TO authenticated
  WITH CHECK (
    current_user_role() = 'GERENTE'
    AND (
      (contract_id IS NOT NULL AND user_has_contract(contract_id))
      OR (followup_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM contract_followups cf
        WHERE cf.id = followup_id AND user_has_contract(cf.contract_id)
      ))
      OR (amendment_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM contract_amendments ca
        WHERE ca.id = amendment_id AND user_has_contract(ca.contract_id)
      ))
    )
  );

CREATE POLICY "espectador_documents" ON documents FOR SELECT TO authenticated
  USING (current_user_role() = 'ESPECTADOR');

-- ── USER_PROFILES ─────────────────────────────────────────────

CREATE POLICY "profile_own_select"
  ON user_profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR current_user_role() = 'ADMIN');

CREATE POLICY "profile_self_insert"
  ON user_profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid() AND role = 'ESPECTADOR');

CREATE POLICY "profile_own_update"
  ON user_profiles FOR UPDATE TO authenticated
  USING    (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    -- Un usuario no puede cambiar su propio rol (solo admin puede)
    AND (current_user_role() = 'ADMIN'
         OR role = (SELECT role FROM user_profiles WHERE id = auth.uid()))
  );

CREATE POLICY "profile_admin"
  ON user_profiles FOR ALL TO authenticated
  USING    (current_user_role() = 'ADMIN')
  WITH CHECK (current_user_role() = 'ADMIN');

-- ── CONTRACT_ASSIGNMENTS ──────────────────────────────────────

CREATE POLICY "assign_admin"
  ON contract_assignments FOR ALL TO authenticated
  USING    (current_user_role() = 'ADMIN')
  WITH CHECK (current_user_role() = 'ADMIN');

CREATE POLICY "assign_own_select"
  ON contract_assignments FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR current_user_role() = 'ADMIN');

-- ── AUDIT_LOG ─────────────────────────────────────────────────
-- Solo ADMIN puede leer; nadie puede modificar directamente

CREATE POLICY "audit_admin_select"
  ON audit_log FOR SELECT TO authenticated
  USING (current_user_role() = 'ADMIN');

-- El INSERT lo hace la función SECURITY DEFINER, no el usuario

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 14. DATOS INICIALES — CATÁLOGOS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INSERT INTO responsible_areas (name) VALUES
  ('Gerencia'),
  ('Secretaría General'),
  ('Subgerencia Administrativa, Financiera y Gestión Humana'),
  ('Subgerencia Técnica'),
  ('Dirección de Operación Urbana'),
  ('Dirección de Ejecución de Proyectos'),
  ('Dirección de Estructuración de Proyectos'),
  ('Dirección de Servicios Públicos')
ON CONFLICT (norm_name) DO NOTHING;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- ERD TEXTUAL — RELACIONES COMPLETAS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
--
-- responsible_areas ──< contracts
-- supervisors       ──< contracts
-- contractors       ──< contracts
-- paa_lines         ──< contracts
-- contracts         ──< contracts (parent_contract_id, contratos derivados)
--
-- contracts ──1:1── interadmin_contract_details
-- contracts ──1:1── invoice_payment_details
-- contracts ──1:1── contract_policies
-- contracts ──1:1── mipymes_stats
--
-- contracts ──1:N── budget_commitments
-- contracts ──1:N── contract_amendments
-- contracts ──1:N── contract_extensions
-- contracts ──1:N── contract_suspensions
-- contracts ──1:N── payments
-- contracts ──1:N── contract_followups
-- contracts ──1:N── documents (via contract_id)
--
-- contract_followups ──1:N── documents (via followup_id)
-- contract_amendments ──1:N── documents (via amendment_id)
--
-- auth.users ──1:1── user_profiles
-- user_profiles ──N:M── contracts (via contract_assignments)
-- user_profiles ──1:N── contract_followups (recorded_by)
-- user_profiles ──1:N── documents (uploaded_by)
-- user_profiles ──1:N── audit_log
--
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- NOTA SOBRE JERARQUÍA (Excel → BD)
-- • Hoja "Contratos Interadministrativos" → contract_type INTERADMINISTRATIVO
--       + interadmin_contract_details (secretaría, cuota admin., bolsa mandato).
-- • Hoja "Contratación_20XX" → columna "Proyecto" (col. 0):
--     a) Texto (FUNCIONAMIENTO, GASTO DE OPERACIÓN COMERCIAL, etc.)
--        → contract_type DIRECTO + resource_type
--     b) Número XXXX-YYYY (contrato interadmin padre)
--        → contract_type DERIVADO + parent_contract_id
-- • No existe tabla `projects`: el interadministrativo es el marco; los derivados ejecutan.
-- • v_derived_contracts lista hijos; funcionamiento EPUXUA = DIRECTO sin padre.
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
