-- Tabla de control de uso del Asistente IA
-- Ejecutar en Supabase SQL Editor. No requiere reload de schema cache.

CREATE TABLE IF NOT EXISTS interadmin_ai_usage_log (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID        NOT NULL,
  user_email  TEXT,
  endpoint    TEXT        NOT NULL,  -- 'unified' | 'extracto-bancario'
  file_name   TEXT,
  tokens_est  INT,                   -- estimado de tokens usados
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_user_endpoint_created
  ON interadmin_ai_usage_log (user_id, endpoint, created_at DESC);

-- RLS: solo ADMIN puede leer el log completo; cada usuario ve solo sus registros.
ALTER TABLE interadmin_ai_usage_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_usage_insert_own"
  ON interadmin_ai_usage_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ai_usage_select_own"
  ON interadmin_ai_usage_log FOR SELECT
  USING (auth.uid() = user_id);
