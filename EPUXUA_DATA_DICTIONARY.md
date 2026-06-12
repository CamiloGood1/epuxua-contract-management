# EPUXUA — Diccionario de Datos Oficial
**Versión:** 1.0 | **Fecha:** 2026-06-09  
**Fuente de verdad:** Este documento es la referencia oficial para la alineación entre Excel, Supabase y Frontend.

---

## 1. Dominios del Negocio

EPUXUA gestiona dos tipos de contratos completamente independientes:

| Dominio | Descripción | Entidad raíz |
|---------|-------------|--------------|
| **INTERADMINISTRATIVOS** | Contratos de mandato con Secretarías de Gobierno de Soacha. EPUXUA administra recursos de terceros. Tienen jerarquía: Proyecto → Contrato Principal → Derivados. | `projects` |
| **FUNCIONAMIENTO** | Contratos de apoyo operativo con recursos propios de EPUXUA (nómina, servicios, arriendos, etc.). Sin jerarquía. Contratos independientes. | `contracts` |

---

## 2. Catálogo de Tipos de Contrato (`contract_type_enum`)

| Valor enum | Dominio | Descripción | Aparece en Dashboard |
|------------|---------|-------------|----------------------|
| `INTERADMINISTRATIVO` | Interadministrativos | Contrato principal entre EPUXUA y una Secretaría de Gobierno | ✓ Sí |
| `DERIVADO` | Interadministrativos | Contrato de ejecución derivado del interadministrativo. Tiene `parent_contract_id`. | ✓ Sí (como sub-indicador) |
| `DIRECTO` | Funcionamiento | Contrato de apoyo operativo de EPUXUA. Sin `parent_contract_id`. | ✓ Sí (solo los de Funcionamiento) |
| `TIENDA_VIRTUAL` | Excluido | Compras bajo Acuerdo Marco de Precio (AMP) — Colombia Compra Eficiente | ✗ No |
| `PAGO_FACTURA` | Excluido | Pago Contra Factura (PCF) — adquisición menor sin formalidad contractual | ✗ No |

### Reglas de clasificación DIRECTO

Un contrato `DIRECTO` es de **Funcionamiento** si:
- `resource_type = 'FUNCIONAMIENTO'` (forma canónica desde 2022)
- `resource_type IS NULL` y no tiene `parent_contract_id` (contratos 2021 sin clasificación explícita)

Un contrato `DIRECTO` es de **Operación Comercial** (excluir del dashboard) si:
- `resource_type ILIKE '%comercial%'`

---

## 3. Catálogo de Estados (`contract_status_enum`)

| Valor enum | Etiqueta UI | Descripción | ¿Contabiliza como activo? |
|------------|-------------|-------------|--------------------------|
| `EN_EJECUCION` | En ejecución | Contrato vigente y en curso | ✓ Sí |
| `SUSPENDIDO` | Suspendido | Temporalmente suspendido por acuerdo entre las partes | ✗ No |
| `TERMINADO` | Terminado | Terminó por vencimiento del plazo | ✗ No |
| `TERMINADO_ANTICIPADAMENTE` | T. anticipado | Terminado antes del plazo pactado | ✗ No |
| `LIQUIDADO` | Liquidado | Contrato liquidado — cuentas cerradas y firmadas | ✗ No |
| `CIERRE_CONTRACTUAL` | Cierre contractual | En proceso de cierre formal del expediente | ✗ No |
| `DECLARADO_FALLIDO` | Fallido | El contratista incumplió — se declaró siniestro | ✗ No |
| `ACTA_NO_EJECUCION` | No ejecución | Se firmó acta de no inicio / no ejecución | ✗ No |
| `NO_SUSCRIPCION` | No suscripción | El contrato fue seleccionado pero no se suscribió | ✗ No |

---

## 4. Catálogo de Modalidades de Selección (`selection_modality_enum`)

| Valor enum | Etiqueta UI | Descripción | Aplica en |
|------------|-------------|-------------|-----------|
| `CONTRATACION_DIRECTA` | Contratación directa | Selección directa sin proceso competitivo | Funcionamiento, Derivados |
| `INVITACION_ABIERTA` | Invitación abierta | Convocatoria pública | Funcionamiento |
| `INVITACION_PRESELECCIONADOS` | Preseleccionados | Invitación a lista corta de proveedores | Funcionamiento |
| `CONCURSO_MERITOS` | Concurso de méritos | Para consultorías | Funcionamiento |
| `ORDEN_COMPRA` | Orden de compra | Para bienes o servicios estandarizados | Funcionamiento |
| `ACUERDO_MARCO` | Acuerdo marco | Bajo AMP de Colombia Compra | Tienda Virtual |
| `TIENDA_VIRTUAL` | Tienda Virtual | Canal de Colombia Compra | Tienda Virtual |
| `PAGO_FACTURA` | Pago Contra Factura | Sin proceso de selección | PCF |

---

## 5. Catálogo de Ciclo de Vida de Proyectos (`project_lifecycle_enum`)

Solo aplica para proyectos **INTERADMINISTRATIVOS**. No aplica a Funcionamiento.

| Valor enum | Etiqueta UI | Descripción | Color |
|------------|-------------|-------------|-------|
| `PLANEACION` | Planeación | Proyecto en estructuración | Azul |
| `CONTRATACION` | Contratación | En proceso de suscripción del contrato | Amarillo |
| `EJECUCION` | Ejecución | Contrato suscrito y en ejecución activa | Verde |
| `SEGUIMIENTO` | Seguimiento | En monitoreo de avance | Violeta |
| `LIQUIDACION` | Liquidación | En proceso de liquidación | Naranja |
| `CERRADO` | Cerrado | Proyecto cerrado — expediente cerrado | Gris |

---

## 6. Catálogo de Tipos de Proyecto (`project_type`)

| Valor | Descripción | ¿Aparece en Kanban? | ¿Aparece en Dashboard? |
|-------|-------------|---------------------|------------------------|
| `INTERADMINISTRATIVO` | Proyecto con contrato de mandato con secretaría | ✓ Sí | ✓ Sí (sección Interadmin) |
| `FUNCIONAMIENTO` | Proyecto contenedor técnico (agrupa contratos DIRECTO por año) | ✗ No | ✗ No directo |
| `OPERACION_COMERCIAL` | **OBSOLETO / EXCLUIR** | ✗ No | ✗ No |
| `TIENDA_VIRTUAL` | **OBSOLETO / EXCLUIR** | ✗ No | ✗ No |
| `PAGO_FACTURA` | **OBSOLETO / EXCLUIR** | ✗ No | ✗ No |

---

## 7. Definición de Campos por Tabla

### 7.1 `contracts` — Tabla maestra de contratos

| Campo | Tipo | Requerido | Descripción | Regla de negocio |
|-------|------|-----------|-------------|-----------------|
| `id` | UUID | ✓ | Clave primaria | Auto-generado |
| `contract_number` | TEXT | ✓ | Número oficial del contrato | Formato: `NNN-AAAA` (ej: `001-2025`) |
| `year` | INTEGER | ✓ | Año de suscripción | No necesariamente igual al año en `contract_number` |
| `contract_type` | ENUM | ✓ | Tipo de contrato | Ver §2 |
| `selection_modality` | ENUM | ✓ | Modalidad de selección | Ver §4 |
| `contract_class` | TEXT | ✓ | Clase/categoría del contrato | Ej: "Prestación de servicios profesionales", "Arrendamiento" |
| `resource_type` | TEXT | — | Tipo de recurso | Ej: "FUNCIONAMIENTO", "GASTO DE OPERACION COMERCIAL" |
| `object` | TEXT | ✓ | Objeto del contrato | Descripción completa del alcance |
| `contractor_id` | UUID | ✓ | FK → `contractors.id` | Persona natural o jurídica contratada |
| `supervisor_id` | UUID | — | FK → `supervisors.id` | Funcionario EPUXUA que supervisa |
| `responsible_area_id` | UUID | — | FK → `responsible_areas.id` | Área interna responsable |
| `parent_contract_id` | UUID | — | FK → `contracts.id` | Solo contratos DERIVADO tienen este campo |
| `project_id` | UUID | — | FK → `projects.id` | Proyecto al que pertenece (interadmin o contenedor func) |
| `paa_code` | TEXT | — | Código en el PAA | Plan Anual de Adquisiciones |
| `paa_description` | TEXT | — | Descripción en PAA | — |
| `paa_estimated_value` | NUMERIC | — | Valor estimado en PAA | COP |
| `subscription_date` | DATE | ✓ | Fecha de suscripción/firma | — |
| `publication_date` | DATE | — | Fecha de publicación en SECOP | — |
| `start_date` | DATE | — | Fecha de inicio de ejecución | — |
| `initial_term_text` | TEXT | — | Plazo en texto | Ej: "6 meses", "65 días" |
| `initial_term_days` | INTEGER | — | Plazo en días | Calculado o ingresado |
| `end_date` | DATE | — | Fecha de terminación | Actualizado por trigger en prórrogas |
| `liquidation_date` | DATE | — | Fecha de liquidación | — |
| `file_closure_date` | DATE | — | Fecha de cierre de expediente | — |
| `monthly_value` | NUMERIC | — | Valor mensual (contratos a término) | COP |
| `initial_value` | NUMERIC | ✓ | Valor inicial del contrato | COP. `>= 0` |
| `total_additions_value` | NUMERIC | ✓ | Suma de todas las adiciones | COP. Actualizado por trigger |
| `paid_value` | NUMERIC | ✓ | Suma de pagos realizados | COP. Actualizado por trigger |
| `future_validity` | NUMERIC | — | Vigencias futuras comprometidas | COP |
| `status` | ENUM | ✓ | Estado del contrato | Ver §3 |
| `secop_url` | TEXT | — | URL del contrato en SECOP II | — |
| `technical_file_url` | TEXT | — | URL del expediente técnico | SharePoint o similar |
| `interventor` | TEXT | — | Nombre del interventor | Nombre libre (no FK) |
| `observations` | TEXT | — | Observaciones generales | — |

**Campos calculados (no almacenados, vienen de `v_contract_detail`):**

| Campo calculado | Fórmula | Descripción |
|-----------------|---------|-------------|
| `final_value` | `initial_value + total_additions_value` | Valor total vigente |
| `pending_value` | `final_value - paid_value` | Por pagar |
| `financial_progress_pct` | `paid_value / final_value * 100` | % de avance financiero |
| `days_remaining` | `end_date - CURRENT_DATE` | Días restantes. Negativo = vencido |

### 7.2 `projects` — Proyectos de gestión

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `id` | UUID | ✓ | Clave primaria |
| `project_code` | TEXT | ✓ | Código único del proyecto | Formato: `XXX-AAAA` o `FUNCIONAMIENTO-AAAA` |
| `name` | TEXT | ✓ | Nombre descriptivo del proyecto |
| `project_type` | TEXT | ✓ | Tipo de proyecto | Ver §6 |
| `year` | INTEGER | ✓ | Año del proyecto |
| `lifecycle_status` | ENUM | ✓ | Estado del ciclo de vida | Ver §5. Solo INTERADMIN. |
| `secretaria` | TEXT | — | Nombre de la Secretaría contratante | Solo INTERADMIN |
| `primary_contract_id` | UUID | — | FK → contrato principal | Solo INTERADMIN |
| `total_value` | NUMERIC | ✓ | Valor total del proyecto | COP |
| `goods_services_value` | NUMERIC | ✓ | Bolsa de mandato (bienes y servicios) | COP. Excluye cuota admin. |
| `management_fee_type` | ENUM | — | Tipo de cuota admin | `PORCENTAJE` o `VALOR_FIJO` |
| `management_fee_value` | NUMERIC | — | % o valor fijo de cuota admin | |
| `management_fee_amount` | NUMERIC | ✓ | Cuota de administración calculada | COP |
| `executed_value` | NUMERIC | ✓ | Valor ejecutado (bolsa mandato) | COP. Actualizado por trigger |
| `paid_value` | NUMERIC | ✓ | Valor pagado total | COP. Actualizado por trigger |
| `active_alerts_count` | INTEGER | ✓ | Número de alertas activas | Actualizado por trigger |
| `observations` | TEXT | — | Observaciones del proyecto | |

### 7.3 `interadmin_contract_details` — Detalle financiero interadmin

| Campo | Descripción |
|-------|-------------|
| `admin_fee_initial` | Cuota de administración inicial (COP) |
| `admin_fee_additions` | Adiciones a la cuota de admin (COP) |
| `admin_fee_total` | Total cuota admin (COP) |
| `mandate_pool_initial` | Bolsa de mandato inicial (COP) |
| `mandate_pool_additions` | Adiciones a la bolsa (COP) |
| `mandate_pool_total` | Total bolsa de mandato (COP) |
| `pending_collection` | Pendiente por cobrar (COP) |

### 7.4 `supervisors` — Supervisores internos EPUXUA

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | Clave primaria |
| `full_name` | TEXT | Nombre completo del funcionario |
| `position` | TEXT | Cargo (opcional) |
| `area_id` | UUID | FK → `responsible_areas` (opcional) |

### 7.5 `contractors` — Contratistas

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | Clave primaria |
| `full_name` | TEXT | Nombre completo o razón social |
| `document_number` | TEXT | CC o NIT |
| `person_type` | TEXT | `NATURAL` o `JURIDICA` |

### 7.6 `payments` — Pagos individuales

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | Clave primaria |
| `contract_id` | UUID | FK → `contracts.id` |
| `payment_date` | DATE | Fecha del pago |
| `gross_value` | NUMERIC | Valor bruto (COP) |
| `deductions` | NUMERIC | Descuentos (retención en fuente, etc.) |
| `net_value` | NUMERIC | Valor neto pagado (COP) |
| `description` | TEXT | Descripción del pago |

### 7.7 `budget_commitments` — CDP y CRP

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | Clave primaria |
| `contract_id` | UUID | FK → `contracts.id` |
| `commitment_type` | TEXT | `CDP` o `CRP` |
| `commitment_number` | TEXT | Número del certificado |
| `value` | NUMERIC | Valor comprometido (COP) |
| `commitment_date` | DATE | Fecha del certificado |

---

## 8. Reglas de Negocio Críticas

### RN-01: Clasificación de contratos en el Dashboard

```
MOSTRAR en Dashboard:
  - INTERADMINISTRATIVOS: project_type = 'INTERADMINISTRATIVO'
  - FUNCIONAMIENTO: contract_type = 'DIRECTO' AND parent_contract_id IS NULL
                    AND resource_type NOT ILIKE '%comercial%'

NO MOSTRAR en Dashboard:
  - contract_type IN ('TIENDA_VIRTUAL', 'PAGO_FACTURA')
  - resource_type ILIKE '%comercial%'
  - project_type IN ('OPERACION_COMERCIAL', 'TIENDA_VIRTUAL', 'PAGO_FACTURA')
```

### RN-02: Jerarquía contractual interadministrativa

```
Un proyecto INTERADMINISTRATIVO tiene exactamente:
  1. Un contrato INTERADMINISTRATIVO (el principal, vinculado vía project.primary_contract_id)
  N. Contratos DERIVADO (vinculados vía contracts.parent_contract_id = principal.id)

Un contrato DERIVADO:
  - SIEMPRE tiene parent_contract_id
  - NUNCA tiene project_id propio
  - Pertenece al proyecto de su padre implícitamente
```

### RN-03: Funcionamiento es independiente

```
Un contrato de Funcionamiento:
  - contract_type = 'DIRECTO'
  - parent_contract_id IS NULL (no tiene padre)
  - project_id puede ser NULL o apuntar a proyecto contenedor técnico
  - NO tiene ciclo de vida de proyecto
  - NO tiene árbol contractual
  - NO aparece en el Kanban
```

### RN-04: Alertas de vencimiento

```
"Próximo a vencer" = EN_EJECUCION AND days_remaining BETWEEN 1 AND 30
"Vencido activo"   = EN_EJECUCION AND (end_date IS NULL OR days_remaining <= 0)
```

### RN-05: Cuota de Administración (Bolsa de Mandato)

```
Para contratos INTERADMINISTRATIVOS:
  total_value = admin_fee_total + mandate_pool_total
  
  admin_fee = cuota que cobra EPUXUA por administrar el contrato
  mandate_pool = recursos para ejecutar la obra/servicio (pertenecen al contratista/secretaría)
  
  En el dashboard: "Valor contratado" = total_value (todo el proyecto)
                   "Valor ejecutado"  = de la bolsa de mandato
```

### RN-06: Estados de funcionamiento del módulo Funcionamiento

```
"Activos"   → status = 'EN_EJECUCION'
"Suspendidos" → status = 'SUSPENDIDO'
"Finalizados" → status IN ('TERMINADO', 'TERMINADO_ANTICIPADAMENTE', 
                            'CIERRE_CONTRACTUAL', 'ACTA_NO_EJECUCION', 'NO_SUSCRIPCION')
"Liquidados"  → status IN ('LIQUIDADO', 'DECLARADO_FALLIDO')
```

### RN-07: KPIs del Dashboard por sección

**INTERADMINISTRATIVOS:**
- Total proyectos activos = proyectos con lifecycle_status NOT IN ('CERRADO')
- Valor contratado = SUM(projects.total_value) filtrado
- Valor ejecutado = SUM(projects.executed_value) filtrado
- Valor pagado = SUM(projects.paid_value) filtrado
- Contratos derivados = SUM(projects.derived_count) filtrado
- Alertas = COUNT(projects WHERE active_alerts_count > 0)

**FUNCIONAMIENTO:**
- Contratos activos = COUNT(contracts WHERE status = 'EN_EJECUCION')
- Valor contratado = SUM(final_value) de todos los contratos (no solo activos)
- Valor promedio = total_value / total_contracts
- Próximos a vencer = COUNT(activos WHERE days_remaining BETWEEN 1 AND 30)
- Vencidos = COUNT(activos WHERE days_remaining <= 0)

---

## 9. Catálogo de Supervisores (top, desde Excel)

Los supervisores son funcionarios internos de EPUXUA. En la BD están en `supervisors`.
Los más frecuentes según el Excel (muestra):

- Darlin Lenis Espitia
- Mercedes Rodriguez
- Jorge Gonzalez
- (59 supervisores totales en la BD migrada)

---

## 10. Catálogo de Entidades / Secretarías

Los proyectos interadministrativos tienen `secretaria` = nombre de la Secretaría contratante.
Ej: "Secretaría General", "Secretaría de Planeación", etc.

Las 8 áreas responsables internas de EPUXUA están en `responsible_areas`.

---

## 11. Terminología Oficial

| Término | Definición |
|---------|------------|
| **CDP** | Certificado de Disponibilidad Presupuestal — reserva presupuestal |
| **CRP** | Certificado de Registro Presupuestal — compromiso definitivo |
| **Cuota de Administración** | Honorarios de EPUXUA por administrar un contrato interadministrativo |
| **Bolsa de Mandato** | Recursos del contratante (Secretaría) para ejecutar la obra/servicio |
| **PAA** | Plan Anual de Adquisiciones — planificación de contratación |
| **PCF** | Pago Contra Factura — adquisición sin proceso formal de contratación |
| **SECOP** | Sistema Electrónico de Contratación Pública de Colombia (secop.gov.co) |
| **Prórroga** | Extensión del plazo de ejecución del contrato |
| **Adición** | Incremento en el valor del contrato |
| **Derivado** | Contrato de ejecución que nace de un interadministrativo |
| **Expediente** | Vista completa de un proyecto interadministrativo (pestañas: resumen, financiero, árbol, etc.) |
| **Funcionamiento** | Contratos de apoyo operativo con recursos propios de EPUXUA |
| **Interadministrativo** | Contrato de mandato entre EPUXUA y una entidad pública (Secretaría) |

---

*Este documento debe mantenerse actualizado cuando se modifiquen enums, reglas de negocio o campos en la BD.*
