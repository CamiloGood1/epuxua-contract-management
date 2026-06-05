# EPUXUA — Modelo de Datos Definitivo
> Generado el 2026-06-02 | Basado exclusivamente en análisis del Excel "Contratación Epuxua E.I.C.E.xlsx"

---

## FASE 1 — ANÁLISIS DEL EXCEL

### Hojas encontradas y su naturaleza

| Hoja | Registros reales | Propósito |
|------|-----------------|-----------|
| Contratos Interadministrativos | 69 | Contratos con Secretarías de Gobierno (mandato sin representación) |
| Contratación_2021 | 11 | Contratos directos año 2021 |
| Contratación_2022 | 63 | Contratos directos año 2022 |
| Contratación_2023 | 92 | Contratos directos año 2023 |
| Contratación_2024 | 161 | Contratos directos año 2024 |
| Contratación_2025 | 209 | Contratos directos año 2025 (activos) |
| Contratacion_2026 | 100 | Contratos directos año 2026 (vigentes hoy) |
| CONTROL | 638 | Hoja calculada de control y alerta (fórmulas) |
| CONTROL INTERADMIN. | ~69 | Hoja calculada de control interadmin |
| Pago contra Factura | 81 | Adquisiciones menores sin contrato formal |
| PAA_2023 | ~40 | Plan Anual de Adquisiciones 2023 |
| PAA 2024 | ~170 | Plan Anual de Adquisiciones 2024 con contratos vinculados |
| Tienda_Virtual_2024-2021 | 35 | Compras por Acuerdo Marco (Colombia Compra Eficiente) |
| PAGOS | 2,112 reales | Registro pago a pago de todos los contratos |
| Hoja 4 | 0 | Sin datos — ignorar |

**Total de contratos históricos: ~636 (2021–2026)**
**Total de pagos registrados: ~2,112**

---

### Entidades detectadas en el Excel

1. **Contratos** — entidad principal. Existen 4 modalidades operativas distintas:
   - Contratación Directa / Invitación / Concurso (hoja por año)
   - Contratos Interadministrativos (hoja propia, estructura financiera diferente)
   - Tienda Virtual / Acuerdo Marco (hoja propia)
   - Pago contra Factura (hoja propia, adquisición sin contrato)

2. **Contratistas / Proveedores** — aparecen como texto plano. En 2026 se agrega CC/NIT.

3. **Supervisores** — funcionarios internos de EPUXUA. Texto plano en todas las hojas.

4. **Áreas Responsables** — unidades internas de EPUXUA. Texto plano.

5. **Prórrogas** — múltiples por contrato, almacenadas como texto libre (ej: "3 meses\n7 días"). En 2025–2026 se estructura con N° prórroga + plazo + fecha.

6. **Suspensiones / Reinicios** — texto libre "N/A" o fecha. En 2025–2026 se agregan campos separados: N° suspensión, fecha, tiempo, tiempo total suspendido.

7. **Adiciones** — valor de adición + CDP adición + CRP adición + rubro adición. En 2026 se distingue "Modificación" como tipo.

8. **Pagos** — hoja PAGOS: pago individual por contrato, con valor bruto, descuentos, neto, % acumulado.

9. **CDP / CRP** — Certificado Disponibilidad Presupuestal / Registro Presupuestal. Número + fecha + rubro + valor.

10. **Pólizas de Seguro** — N° póliza, entidad que la emite, fecha expedición, fecha inicio, fecha fin, fecha aprobación. Aparece en 2025–2026.

11. **PAA** — Plan Anual de Adquisiciones. Código UNSPSC, descripción, valor estimado, contrato vinculado.

12. **Comité (solo PCF)** — N° de comité, número de acta y fecha de aprobación.

13. **MiPymes** — campos de estadísticas agregadas por contrato (2026): proveedores consultados, MiPymes consultados, adjudicados.

---

### Relaciones detectadas

```
contracts 1:N contract_amendments      (un contrato tiene N adiciones)
contracts 1:N contract_extensions      (un contrato tiene N prórrogas)
contracts 1:N contract_suspensions     (un contrato tiene N suspensiones)
contracts 1:N payments                 (un contrato tiene N pagos)
contracts 1:1 contract_policy          (un contrato tiene 0 o 1 póliza)
contracts 1:1 budget_commitment        (un contrato tiene 1 CDP+CRP)
contracts N:1 contractors              (N contratos → 1 contratista)
contracts N:1 supervisors              (N contratos → 1 supervisor interno)
contracts N:1 responsible_areas        (N contratos → 1 área)
contracts N:1 paa_lines               (N contratos → 1 línea PAA)
interadmin_contracts IS-A contracts    (subentidad con estructura financiera propia)
pago_contra_factura IS-A contracts     (adquisición menor sin contrato formal)
tienda_virtual IS-A contracts          (compra por acuerdo marco)
```

---

## FASE 2 — MODELO RELACIONAL (3FN)

### Diagrama lógico

```
┌─────────────────────────────────────────────────────────────────┐
│                         contracts                               │
│  PK: id (uuid)                                                  │
│  FK: contractor_id → contractors                                │
│  FK: supervisor_id → supervisors                                │
│  FK: responsible_area_id → responsible_areas                    │
│  FK: paa_line_id → paa_lines (nullable)                         │
└─────────────────────────────────────────────────────────────────┘
         │           │             │              │
         1:N         1:N           1:N            1:1
         ↓           ↓             ↓              ↓
    payments  contract_amendments  contract_   budget_commitment
              contract_extensions  suspensions contract_policy
```

---

### Tabla: `contractors`
**Descripción:** Catálogo de personas naturales y jurídicas que contratan con EPUXUA.

| Columna | Tipo | Restricción | Descripción |
|---------|------|-------------|-------------|
| id | uuid | PK | Identificador interno |
| document_number | varchar(20) | UNIQUE NOT NULL | CC o NIT |
| document_type | varchar(5) | CHECK ('CC','NIT','CE','PAS') | Tipo de documento |
| full_name | varchar(255) | NOT NULL | Nombre completo o razón social |
| person_type | varchar(10) | CHECK ('NATURAL','JURIDICA') | Tipo de persona |
| created_at | timestamptz | DEFAULT now() | |

**Índices:** `(document_number)`, `(full_name)` (trgm para búsqueda)

---

### Tabla: `supervisors`
**Descripción:** Funcionarios internos de EPUXUA que supervisan contratos.

| Columna | Tipo | Restricción | Descripción |
|---------|------|-------------|-------------|
| id | uuid | PK | |
| full_name | varchar(255) | NOT NULL | Nombre del supervisor |
| normalized_name | varchar(255) | | Nombre normalizado (mayúsculas, sin tildes) para búsqueda |
| active | boolean | DEFAULT true | Si está activo |
| created_at | timestamptz | DEFAULT now() | |

**Índices:** `(normalized_name)`

---

### Tabla: `responsible_areas`
**Descripción:** Unidades internas de EPUXUA responsables de contratos.

| Columna | Tipo | Restricción | Descripción |
|---------|------|-------------|-------------|
| id | uuid | PK | |
| name | varchar(255) | UNIQUE NOT NULL | Nombre normalizado del área |
| created_at | timestamptz | DEFAULT now() | |

**Valores del Excel (normalizados):**
- Gerencia
- Secretaría General
- Subgerencia Administrativa, Financiera y Gestión Humana
- Subgerencia Técnica
- Dirección de Operación Urbana
- Dirección de Ejecución de Proyectos
- Dirección de Estructuración de Proyectos
- Dirección de Servicios Públicos

---

### Tabla: `contracts`
**Descripción:** Tabla maestra de todos los contratos de EPUXUA (directos, interadministrativos, tienda virtual). Es la entidad central del sistema.

| Columna | Tipo | Restricción | Descripción |
|---------|------|-------------|-------------|
| id | uuid | PK DEFAULT gen_random_uuid() | |
| contract_number | varchar(30) | UNIQUE NOT NULL | Ej: "001-2026", "3407-2021" |
| selection_process_number | varchar(50) | | N° proceso SECOP: "CD-001-2026" |
| contract_type | contract_type_enum | NOT NULL | Tipo de contrato |
| selection_modality | selection_modality_enum | NOT NULL | Modalidad de selección |
| contract_class | varchar(100) | NOT NULL | Clase: "Prestación de servicios", "Arrendamiento", etc. |
| object | text | NOT NULL | Objeto del contrato |
| resource_type | varchar(50) | | "FUNCIONAMIENTO", "GASTOS DE OPERACIÓN COMERCIAL" |
| responsible_area_id | uuid | FK → responsible_areas | |
| supervisor_id | uuid | FK → supervisors | |
| contractor_id | uuid | FK → contractors | |
| paa_line_id | uuid | FK → paa_lines (nullable) | Línea PAA vinculada |
| subscription_date | date | NOT NULL | Fecha de suscripción |
| start_date | date | | Fecha de inicio de ejecución |
| initial_term_text | varchar(100) | | "4 MESES", "65 dias" (texto original) |
| initial_term_days | integer | | Días calculados |
| end_date | date | | Fecha de terminación |
| liquidation_date | date | | Fecha de liquidación |
| file_closure_date | date | | Fecha de cierre de expediente |
| monthly_value | numeric(18,2) | | Valor mensual (aparece desde 2025) |
| initial_value | numeric(18,2) | NOT NULL | Valor inicial del contrato |
| total_additions_value | numeric(18,2) | DEFAULT 0 | Suma de adiciones |
| final_value | numeric(18,2) | GENERATED | initial_value + total_additions_value |
| paid_value | numeric(18,2) | DEFAULT 0 | Valor pagado acumulado |
| pending_value | numeric(18,2) | GENERATED | final_value - paid_value |
| future_validity | numeric(18,2) | DEFAULT 0 | Vigencias futuras |
| status | contract_status_enum | NOT NULL DEFAULT 'EN_EJECUCION' | Estado normalizado |
| secop_url | text | | Link SECOP II |
| technical_file_url | text | | Link ficha técnica (Drive) |
| observations | text | | |
| year | smallint | NOT NULL | Año fiscal del contrato |
| interventor | varchar(255) | | Interventor (desde 2025) |
| created_at | timestamptz | DEFAULT now() | |
| updated_at | timestamptz | DEFAULT now() | |

**Índices:** `(contract_number)`, `(status)`, `(year)`, `(contractor_id)`, `(supervisor_id)`, `(responsible_area_id)`, `(end_date)` (para alertas de vencimiento)

---

### Tabla: `interadmin_contract_details`
**Descripción:** Datos específicos de contratos interadministrativos (mandato sin representación). Solo aplica cuando `contracts.contract_type = 'INTERADMINISTRATIVO'`.

| Columna | Tipo | Restricción | Descripción |
|---------|------|-------------|-------------|
| id | uuid | PK | |
| contract_id | uuid | FK → contracts UNIQUE | Relación 1:1 |
| secretaria | varchar(255) | NOT NULL | Entidad contratante (Secretaría) |
| admin_fee_initial | numeric(18,2) | | Cuota de Administración inicial |
| admin_fee_additions | numeric(18,2) | DEFAULT 0 | Adición Cuota de Administración |
| admin_fee_total | numeric(18,2) | GENERATED | |
| mandate_pool_initial | numeric(18,2) | | Bolsa de gerencia/mandato inicial |
| mandate_pool_additions | numeric(18,2) | DEFAULT 0 | Adición Bolsa de Mandato |
| mandate_pool_total | numeric(18,2) | GENERATED | |
| pending_collection | numeric(18,2) | DEFAULT 0 | Valor Pendiente por Cobrar |
| created_at | timestamptz | DEFAULT now() | |

---

### Tabla: `budget_commitments`
**Descripción:** CDP y CRP asociados a cada contrato.

| Columna | Tipo | Restricción | Descripción |
|---------|------|-------------|-------------|
| id | uuid | PK | |
| contract_id | uuid | FK → contracts | Un contrato puede tener varios CDP/CRP (adiciones) |
| commitment_type | varchar(5) | CHECK ('CDP','CRP') | Tipo de compromiso |
| number | varchar(50) | NOT NULL | Ej: "DIS-2026000001", "RES-2026000003" |
| value | numeric(18,2) | NOT NULL | |
| budget_code | varchar(100) | | RUBRO: "2.1.2.02.02.008.002" |
| date | date | NOT NULL | |
| is_addition | boolean | DEFAULT false | Si corresponde a una adición |
| created_at | timestamptz | DEFAULT now() | |

**Índices:** `(contract_id, commitment_type)`, `(number)`

---

### Tabla: `contract_amendments`
**Descripción:** Adiciones al valor del contrato.

| Columna | Tipo | Restricción | Descripción |
|---------|------|-------------|-------------|
| id | uuid | PK | |
| contract_id | uuid | FK → contracts NOT NULL | |
| amendment_number | smallint | DEFAULT 1 | N° de adición |
| amendment_value | numeric(18,2) | NOT NULL | Valor de la adición |
| amendment_date | date | | Fecha de la adición |
| cdp_number | varchar(50) | | CDP Adición |
| cdp_value | numeric(18,2) | | |
| cdp_date | date | | |
| cdp_budget_code | varchar(100) | | |
| crp_number | varchar(50) | | CRP Adición |
| crp_value | numeric(18,2) | | |
| crp_date | date | | |
| crp_budget_code | varchar(100) | | |
| modification_type | varchar(50) | | "ADICIÓN", "MODIFICACIÓN" (2026) |
| observations | text | | |
| created_at | timestamptz | DEFAULT now() | |

---

### Tabla: `contract_extensions`
**Descripción:** Prórrogas del contrato.

| Columna | Tipo | Restricción | Descripción |
|---------|------|-------------|-------------|
| id | uuid | PK | |
| contract_id | uuid | FK → contracts NOT NULL | |
| extension_number | smallint | | N° de prórroga |
| extension_term_text | varchar(100) | | "UN (1) MES Y DIECISEIS (16) DIAS" |
| extension_term_days | integer | | Días calculados |
| extension_date | date | | Fecha de prórroga |
| new_end_date | date | | Nueva fecha de terminación |
| observations | text | | |
| created_at | timestamptz | DEFAULT now() | |

---

### Tabla: `contract_suspensions`
**Descripción:** Suspensiones y reinicios del contrato.

| Columna | Tipo | Restricción | Descripción |
|---------|------|-------------|-------------|
| id | uuid | PK | |
| contract_id | uuid | FK → contracts NOT NULL | |
| suspension_number | smallint | | N° de suspensión |
| suspension_date | date | NOT NULL | |
| suspension_term_text | varchar(100) | | Tiempo de suspensión (texto) |
| suspension_term_days | integer | | Días calculados |
| restart_date | date | | Fecha de reinicio |
| observations | text | | |
| created_at | timestamptz | DEFAULT now() | |

---

### Tabla: `contract_policies`
**Descripción:** Pólizas de seguro asociadas a contratos (datos desde 2025).

| Columna | Tipo | Restricción | Descripción |
|---------|------|-------------|-------------|
| id | uuid | PK | |
| contract_id | uuid | FK → contracts UNIQUE | 1:1 por contrato |
| policy_number | varchar(100) | | N° de póliza |
| issuing_entity | varchar(255) | | Entidad que emite la póliza |
| issue_date | date | | Fecha de expedición |
| start_date | date | | Fecha de inicio de cobertura |
| end_date | date | | Fecha de finalización |
| approval_date | date | | Fecha de aprobación |
| created_at | timestamptz | DEFAULT now() | |

---

### Tabla: `payments`
**Descripción:** Registro individual de cada pago realizado contra un contrato.

| Columna | Tipo | Restricción | Descripción |
|---------|------|-------------|-------------|
| id | uuid | PK | |
| contract_id | uuid | FK → contracts NOT NULL | |
| payment_number | integer | NOT NULL | N° de pago (EGRESO) |
| payment_date | date | NOT NULL | Fecha del pago |
| gross_value | numeric(18,2) | NOT NULL | Valor bruto del pago |
| deductions | numeric(18,2) | DEFAULT 0 | Descuentos aplicados |
| net_value | numeric(18,2) | GENERATED | gross_value - deductions |
| cumulative_percentage | numeric(7,4) | | % acumulado de ejecución |
| drive_url | text | | Link Drive del contrato |
| created_at | timestamptz | DEFAULT now() | |

**Índices:** `(contract_id)`, `(payment_date)`, `(contract_id, payment_number)` UNIQUE

---

### Tabla: `invoice_payments` (Pago contra Factura)
**Descripción:** Adquisiciones menores sin contrato formal. Equivalente a contratos de mínima cuantía por factura.

| Columna | Tipo | Restricción | Descripción |
|---------|------|-------------|-------------|
| id | uuid | PK | |
| pf_number | varchar(30) | UNIQUE NOT NULL | Ej: "PF-001-2024" |
| provider_name | varchar(255) | NOT NULL | Proveedor |
| requesting_officer | varchar(255) | | Responsable solicitud |
| object | text | NOT NULL | Objeto |
| person_type | varchar(10) | CHECK ('NATURAL','JURIDICA') | |
| responsible_area_id | uuid | FK → responsible_areas | |
| supervisor_id | uuid | FK → supervisors | |
| committee_number | varchar(50) | | N° de comité |
| committee_act_info | text | | Número de acta y fecha de aprobación |
| invoice_date | date | | Fecha de facturación |
| paid_value | numeric(18,2) | | Valor pagado |
| total_value | numeric(18,2) | | Valor total aprobado |
| status | varchar(50) | | PAGO, EJECUTADO, PENDIENTE DE PAGO, PENDIENTE FACTURA |
| observations | text | | |
| year | smallint | NOT NULL | |
| created_at | timestamptz | DEFAULT now() | |

---

### Tabla: `tienda_virtual_orders`
**Descripción:** Compras realizadas a través de la Tienda Virtual de Colombia Compra Eficiente (Acuerdo Marco).

| Columna | Tipo | Restricción | Descripción |
|---------|------|-------------|-------------|
| id | uuid | PK | |
| order_number | varchar(30) | NOT NULL | Número de orden (ej: "79548") |
| contractor_name | varchar(255) | NOT NULL | Proveedor |
| object | text | NOT NULL | Objeto |
| person_type | varchar(10) | | |
| contract_class | varchar(100) | | "Acuerdo Marco", "Grandes Superficies" |
| responsible_area_id | uuid | FK → responsible_areas | |
| supervisor_id | uuid | FK → supervisors | |
| subscription_date | date | | |
| start_date | date | | |
| end_date | date | | |
| initial_value | numeric(18,2) | | |
| additions_value | numeric(18,2) | DEFAULT 0 | |
| paid_value | numeric(18,2) | DEFAULT 0 | |
| pending_value | numeric(18,2) | DEFAULT 0 | |
| future_validity | numeric(18,2) | DEFAULT 0 | |
| total_value | numeric(18,2) | | |
| status | varchar(50) | | |
| observations | text | | |
| secop_url | text | | |
| year | smallint | NOT NULL | |
| created_at | timestamptz | DEFAULT now() | |

---

### Tabla: `paa_lines`
**Descripción:** Líneas del Plan Anual de Adquisiciones.

| Columna | Tipo | Restricción | Descripción |
|---------|------|-------------|-------------|
| id | uuid | PK | |
| paa_code | varchar(20) | NOT NULL | "PAA1", "1", "2" |
| year | smallint | NOT NULL | Año del PAA |
| unspsc_codes | varchar(255) | | Código(s) UNSPSC separados por ; |
| description | text | NOT NULL | Descripción del ítem PAA |
| estimated_start_month | smallint | | |
| duration_number | smallint | | |
| duration_interval | varchar(20) | | "días", "meses", "años" |
| selection_modality | varchar(100) | | |
| resource_source | varchar(100) | | |
| estimated_total_value | numeric(18,2) | | |
| estimated_current_value | numeric(18,2) | | |
| requires_future_validity | boolean | DEFAULT false | |
| responsible_name | varchar(255) | | |
| responsible_phone | varchar(30) | | |
| responsible_email | varchar(255) | | |
| location | varchar(100) | | |
| observations | text | | |
| created_at | timestamptz | DEFAULT now() | |

**Constraint:** UNIQUE `(paa_code, year)`

---

### Tabla: `mipymes_stats`
**Descripción:** Estadísticas de participación MiPymes por contrato (obligatorio desde 2026).

| Columna | Tipo | Restricción | Descripción |
|---------|------|-------------|-------------|
| id | uuid | PK | |
| contract_id | uuid | FK → contracts UNIQUE | |
| providers_consulted | smallint | | Proveedores consultados |
| mipymes_consulted | smallint | | MiPymes consultadas |
| providers_presented | smallint | | Proveedores que se presentaron |
| mipymes_presented | smallint | | MiPymes que se presentaron |
| mipymes_benefited | smallint | | MiPymes beneficiadas por desempate |
| mipymes_participated | boolean | | ¿Participaron MiPymes? |
| limited_to_mipymes | boolean | | ¿Se limitó a MiPymes? |
| awarded_to_mipymes | boolean | | ¿Se adjudicó a MiPymes? |
| created_at | timestamptz | DEFAULT now() | |

---

## FASE 3 — SEGURIDAD Y USUARIOS

### Tabla: `user_profiles`
**Descripción:** Extiende auth.users de Supabase con datos de negocio.

El **`id` no lo introduce el usuario**: coincide con `auth.users.id` y se crea automáticamente al registrarse en Auth (`handle_new_user`) o al iniciar sesión (`ensure_user_profile()` en la app). Para usuarios ya existentes en Auth: `backfill_user_profiles_from_auth()`. Para asignar rol sin copiar UUID: `set_user_role_by_email(correo, rol)`.

| Columna | Tipo | Restricción | Descripción |
|---------|------|-------------|-------------|
| id | uuid | PK FK → auth.users | Asignado por Supabase Auth (automático) |
| full_name | varchar(255) | NOT NULL | |
| role | user_role_enum | NOT NULL | 'ADMIN', 'GERENTE', 'ESPECTADOR' |
| responsible_area_id | uuid | FK → responsible_areas (nullable) | Área del gerente |
| active | boolean | DEFAULT true | |
| created_at | timestamptz | DEFAULT now() | |
| updated_at | timestamptz | DEFAULT now() | |

### Tabla: `contract_assignments`
**Descripción:** Asigna contratos a gerentes de proyecto para control de acceso.

| Columna | Tipo | Restricción | Descripción |
|---------|------|-------------|-------------|
| id | uuid | PK | |
| user_id | uuid | FK → user_profiles | |
| contract_id | uuid | FK → contracts | |
| assigned_at | timestamptz | DEFAULT now() | |
| assigned_by | uuid | FK → user_profiles | |

**Constraint:** UNIQUE `(user_id, contract_id)`

---

## FASE 4 — SQL COMPLETO PARA SUPABASE

Ver archivo: `EPUXUA_DDL.sql`

---

## FASE 6 — MIGRACIÓN DEL EXCEL

### Mapeo por hoja (jerarquía contractual)

| Origen Excel | `contract_type` | Relación |
|--------------|-----------------|----------|
| **Contratos Interadministrativos** | `INTERADMINISTRATIVO` | Marco con Secretaría → `interadmin_contract_details` |
| **Contratación_20XX**, col. **Proyecto** = número (`3437-2021`) | `DERIVADO` | Hijo → `parent_contract_id` al interadmin |
| **Contratación_20XX**, col. **Proyecto** = texto (`FUNCIONAMIENTO`, etc.) | `DIRECTO` | Funcionamiento / operación EPUXUA → `resource_type` |
| **Tienda_Virtual** | `TIENDA_VIRTUAL` | — |
| **Pago contra Factura** | `PAGO_FACTURA` | — |

La columna **Proyecto** (primera columna de las hojas Contratación) es la clave:
- Si parece un contrato (`^\d{3,5}-\d{4}$`) → derivado del interadministrativo con ese número.
- Si es texto → contrato de funcionamiento u otro recurso propio de EPUXUA.

#### Hojas Contratación_2021 a Contratacion_2026 → `contracts`

| Columna Excel | Columna BD | Transformación |
|---------------|-----------|----------------|
| **Proyecto** (col. 0) | `parent_contract_ref` o `resource_type` | Número → DERIVADO; texto → DIRECTO + resource_type |
| Contrato / Número del Contrato | contract_number | Trim, UNIQUE por (número, año, tipo) |
| Número Proceso de Selección | selection_process_number | Trim |
| Modalidad De Selección | selection_modality | Normalizar (ver enum) |
| Contratista | contractors.full_name | Crear o reusar por nombre |
| CC / NIT (solo 2026) | contractors.document_number | Limpiar formato |
| Persona Natural O Jurídica | contractors.person_type | 'NATURAL'/'JURIDICA' |
| Clase De Contrato | contract_class | Normalizar casing |
| Area responsable | responsible_areas.name | Normalizar, crear catálogo |
| Supervisor | supervisors.full_name | Normalizar, crear catálogo |
| Objeto Del Contrato | object | Texto completo |
| Fecha De Suscripción | subscription_date | date |
| Plazo de ejecución Inicial | initial_term_text + initial_term_days | Parsear texto → días |
| Fecha de inicio de ejecución | start_date | date |
| Valor Inicial Del Contrato | initial_value | numeric |
| Adición | → contract_amendments.amendment_value | Crear registro si > 0 |
| Valor Final Del Contrato | IGNORAR (campo calculado) | Se calcula en BD |
| Prorroga | → contract_extensions | Parsear texto libre |
| Fecha de terminación | end_date | date |
| Valor pagado | paid_value | numeric |
| Valor pendiente por pagar | IGNORAR (calculado) | |
| Vigencia Futura | future_validity | numeric |
| RECURSO | resource_type | |
| RUBRO | → budget_commitments.budget_code | |
| CDP | → budget_commitments (tipo CDP) | |
| FECHA DE CDP | → budget_commitments.date | |
| CRP | → budget_commitments (tipo CRP) | |
| FECHA DE CRP | → budget_commitments.date | |
| Estado | status | Normalizar (ver enum) |
| OBSERVACIONES | observations | |
| PAA | → paa_lines lookup | |
| SECOP / LINK FICHA TÉCNICA | secop_url, technical_file_url | |
| N° DE POLIZA (2025+) | → contract_policies | |
| Valor mensual (2025+) | monthly_value | |
| FECHA DE LIQUIDACIÓN (2025+) | liquidation_date | |
| FECHA CIERRE EXPEDIENTE (2025+) | file_closure_date | |
| INTERVENTOR (2025+) | interventor | |
| MiPymes (2026) | → mipymes_stats | |

#### Adiciones por año (cols 16-25 en 2025, 33-42 en 2026) → `contract_amendments`
Transformar cada adición presente en → 1 registro en `contract_amendments`.

#### Prórrogas → `contract_extensions`
- 2021–2024: texto libre ("3 meses\n7 días"). Parsear con regex → n registros.
- 2025–2026: estructurado (N° prórroga, plazo, fecha) → directo.

#### Suspensiones → `contract_suspensions`
- 2021–2024: "SUSPENSION" y "REINICIO" como fechas o "N/A".
- 2025–2026: N° suspensión + fecha + tiempo + total suspendido.

#### Contratos Interadministrativos → `contracts` + `interadmin_contract_details`
| Col Excel | Destino |
|-----------|---------|
| Contrato (col 0) | contracts.contract_number |
| Secretaria | interadmin_contract_details.secretaria |
| Modalidad de Selección | contracts.selection_modality |
| Clase de contrato | contracts.contract_class |
| Area Responsable | contracts.responsible_area_id |
| Supervisión | contracts.supervisor_id |
| Valor Inicial | contracts.initial_value |
| Adición | contract_amendments |
| Cuota de Administración INICIAL | interadmin_contract_details.admin_fee_initial |
| Total Cuota de Administración | (calculado) |
| Bolsa de gerencia inicial | interadmin_contract_details.mandate_pool_initial |
| Total Bolsa de Mandato | (calculado) |
| Valor Pendiente por Cobrar | interadmin_contract_details.pending_collection |

#### Pago contra Factura → `invoice_payments`
| Col Excel | Destino |
|-----------|---------|
| Col 0 (PF-XXX-YYYY) | pf_number |
| Proveedor | provider_name |
| Responsable Solicitud | requesting_officer |
| Objeto | object |
| Persona Natural/Jurídica | person_type |
| Area responsable | responsible_area_id |
| Supervisor | supervisor_id |
| N° comité | committee_number |
| Acta y Fecha | committee_act_info |
| Fecha Facturación | invoice_date |
| Valor pagado | paid_value |
| Valor Total | total_value |
| Estado | status |

#### PAGOS → `payments`
| Col Excel | Destino |
|-----------|---------|
| EGRESO | payment_number |
| AÑO | (para lookup del contrato) |
| contrato | → contracts.contract_number lookup |
| FECHA | payment_date |
| VALOR | gross_value |
| DESCUENTOS | deductions |
| NETO | (calculado) |
| % PAGO | cumulative_percentage |
| DRIVE/CONTRATO | drive_url |

#### PAA_2023 → `paa_lines` (year=2023)
#### PAA 2024 → `paa_lines` (year=2024)
#### Tienda_Virtual → `tienda_virtual_orders`

---

### Problemas de calidad detectados

1. **Estados inconsistentes:** +20 variantes de "EN EJECUCIÓN" (typos: "EN EJEUCIÓN", "EN EJUCUCIÓN"). Requieren normalización con enum.

2. **Modalidades inconsistentes:** "Contratación Directa", "CONTRATACION DIRECTA", "contratacion directa" → misma categoría.

3. **Supervisores con múltiples grafías:** "juan Pablo Cañon" vs "Juan Pablo Cañon" vs "Juan pablo canon".

4. **Prórrogas en texto libre (2021–2024):** "3 MESES \n12 dias\n3 meses" no normalizable automáticamente → revisión manual.

5. **Valores numéricos con formato moneda:** algunas celdas tienen "$" o separadores de miles → limpiar antes de importar.

6. **Fechas fuera de rango:** Supabase detecta valores erróneos (celdas U10, K204 en 2024 con serial inválido).

7. **Contratos sin número:** Algunas filas de CONTROL tienen número = "0" → ignorar.

8. **Hoja PAGOS:** La mayoría de las filas (post-pago real) son ceros de relleno del formato Excel. Solo importar las ~2,112 filas con contrato válido.

9. **Contratistas sin CC/NIT (2021–2024):** Solo hay nombre de texto. La deduplicación será por nombre normalizado, con riesgo de duplicados homónimos.

10. **Campos calculados en Excel:** "Valor Final", "Valor pendiente por pagar", "Días de vencimiento", "ALERTA" son fórmulas Excel — NO migrar, recalcular en BD.

---

## FASE 7 — ADAPTACIÓN DEL FRONTEND

### Dashboard (`/`)
**Consultas requeridas:**
```sql
-- KPIs
SELECT status, COUNT(*), SUM(initial_value) FROM contracts GROUP BY status;
SELECT COUNT(*) FROM contracts WHERE end_date BETWEEN now() AND now() + interval '30 days';

-- Gráfico donut
SELECT status, COUNT(*) FROM contracts GROUP BY status;

-- Barras por entidad
SELECT ra.name, COUNT(*) FROM contracts c 
JOIN responsible_areas ra ON c.responsible_area_id = ra.id GROUP BY ra.name;

-- Contratos recientes
SELECT * FROM contracts ORDER BY created_at DESC LIMIT 10;
```

**Vista requerida:** `v_dashboard_kpis` — métricas agregadas

### Contratos (`/contracts`)
**Consultas requeridas:**
```sql
SELECT c.*, co.full_name AS contractor_name, s.full_name AS supervisor_name, ra.name AS area_name
FROM contracts c
JOIN contractors co ON c.contractor_id = co.id
JOIN supervisors s ON c.supervisor_id = s.id
JOIN responsible_areas ra ON c.responsible_area_id = ra.id
WHERE c.status = $1 AND c.year = $2
ORDER BY c.contract_number DESC;
```

**Filtros necesarios:** status, year, responsible_area_id, supervisor_id, contract_type

### Contrato Detalle (`/contracts/[id]`)
**Consultas requeridas:**
```sql
-- Datos principales
SELECT c.*, co.*, s.*, ra.*, icd.*, cp.*
FROM contracts c
LEFT JOIN contractors co ON c.contractor_id = co.id
LEFT JOIN supervisors s ON c.supervisor_id = s.id
LEFT JOIN responsible_areas ra ON c.responsible_area_id = ra.id
LEFT JOIN interadmin_contract_details icd ON icd.contract_id = c.id
LEFT JOIN contract_policies cp ON cp.contract_id = c.id
WHERE c.id = $1;

-- Adiciones
SELECT * FROM contract_amendments WHERE contract_id = $1 ORDER BY amendment_number;

-- Prórrogas
SELECT * FROM contract_extensions WHERE contract_id = $1 ORDER BY extension_number;

-- Suspensiones
SELECT * FROM contract_suspensions WHERE contract_id = $1 ORDER BY suspension_number;

-- Pagos
SELECT * FROM payments WHERE contract_id = $1 ORDER BY payment_number;
```

**Vista requerida:** `v_contract_detail` — todo en un JOIN

### Seguimiento
**Vista requerida:** `v_contract_tracking`
```sql
-- Ejecución financiera
SELECT 
  c.contract_number, c.final_value, c.paid_value,
  ROUND(c.paid_value / NULLIF(c.final_value,0) * 100, 2) AS financial_progress_pct,
  -- Días transcurridos vs plazo total
  EXTRACT(DAY FROM now() - c.start_date) AS days_elapsed,
  EXTRACT(DAY FROM c.end_date - c.start_date) AS total_days,
  -- Pagos recientes
  (SELECT MAX(payment_date) FROM payments WHERE contract_id = c.id) AS last_payment_date
FROM contracts c WHERE c.status = 'EN_EJECUCION';
```

### Contratos Derivados
**Nota del Excel:** Los contratos interadministrativos generan contratos "hijo" en las hojas anuales (ej: el interadmin 3431-2021 genera contratos de obra ejecutados por el contratista). Esta relación no está explícita en el Excel como FK, pero se puede deducir por el campo `secretaria` y fechas coincidentes.

**Tabla adicional requerida (justificada por el frontend):**
```sql
-- Si el front muestra "contratos derivados" necesitamos:
ALTER TABLE contracts ADD COLUMN parent_contract_id uuid REFERENCES contracts(id);
```
Esta relación NO existe en el Excel (es implícita). Se documenta como campo complementario.

---

## FASE 8 — RIESGOS

| # | Riesgo | Severidad | Mitigación |
|---|--------|-----------|------------|
| 1 | Deduplicación de contratistas por nombre (sin CC) | ALTA | Revisión manual post-migración 2021-2024 |
| 2 | Prórrogas en texto libre no parseables | ALTA | Migrar como `initial_term_text`, parsear manualmente |
| 3 | Fechas con serial inválido en 2024 | MEDIA | Filtrar antes de import, marcar como NULL |
| 4 | Estados con typos y variantes | MEDIA | Normalizar con función de mapeo antes de insert |
| 5 | Contratos sin número (filas de relleno Excel) | BAJA | WHERE contract_number IS NOT NULL AND contract_number != '0' |
| 6 | Valores financieros con texto ("$", comas) | MEDIA | Limpiar con regex en script de migración |
| 7 | Hoja CONTROL tiene fórmulas #REF! | BAJA | No migrar CONTROL, es vista calculada |
| 8 | PAA vinculado por texto ("PAA1") no por ID | MEDIA | Migrar PAA primero, luego hacer lookup |

---

## FASE 9 — RECOMENDACIONES TÉCNICAS

1. **Migrar en orden:** responsible_areas → supervisors → contractors → paa_lines → contracts → detalles hijos
2. **No migrar hojas CONTROL y CONTROL INTERADMIN.** — son vistas calculadas de Excel. Reemplazar con views de Supabase.
3. **Crear función `normalize_text()`** en PostgreSQL para estandarizar mayúsculas y tildes durante migración.
4. **Usar `COPY` de PostgreSQL** o Supabase bulk insert para los 2,112 pagos — no insert por fila.
5. **Habilitar `pg_trgm`** para búsqueda fuzzy de contratistas y supervisores.
6. **Crear `updated_at` trigger** en todas las tablas principales.
7. **Los campos `final_value`, `pending_value`, `net_value`** NO deben ser GENERATED ALWAYS (Supabase no los soporta bien en RLS) — usar triggers o vistas calculadas.
8. **Separar contratos activos de históricos** con índice parcial en `status = 'EN_EJECUCION'` para performance de dashboard.
