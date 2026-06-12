# EPUXUA — Auditoría Completa: Contratos de Funcionamiento
**Fecha:** 2026-06-09 | **Estado:** Análisis estático completado — Validación Supabase pendiente

---

## Resumen Ejecutivo

| Fuente | Total | EN_EJECUCION | Observación |
|--------|-------|--------------|-------------|
| **[A] Excel** (CSV migrado) | **284** | **116** | Fuente de verdad |
| **[B] Supabase BD** (estimado) | **285** | a confirmar | Import SQL inserta 285 (1 extra vs Excel) |
| **[C] Frontend** `getFuncionamientoContracts()` | **pendiente** | pendiente | Depende de si project_id fue seteado en el backfill |

**Hipótesis principal:** El módulo de Funcionamiento puede estar mostrando **0 contratos históricos** si el backfill V3 no enlazó los contratos migrados a sus proyectos contenedor FUNCIONAMIENTO-AAAA.

---

## FUENTE A — Excel (clean_data/contracts.csv)

### Definición aplicada
```
contract_type = 'DIRECTO'
AND parent_contract_ref = '' (sin referencia a padre)
AND resource_type = 'FUNCIONAMIENTO'
```

### Totales por año

| Año | Total | EN_EJECUCION | Terminados | Cierre | Liquidados | Sin estado |
|-----|-------|-------------|------------|--------|------------|------------|
| 2021 | 5 | 0 | 0 | 5 | 0 | 0 |
| 2022 | 24 | 0 | 4 | 13 | 4 | 1 |
| 2023 | 58 | 0 | 12 | 29 | 1 | 1 |
| 2024 | 77 | 3 | 37 | 3 | 27 | 1 |
| 2025 | 84 | 79 | 2 | 0 | 0 | 3 |
| 2026 | 36 | 36 | 0 | 0 | 0 | 0 |
| **TOTAL** | **284** | **116** | **55** | **60** | **29** | **6** |

> **Nota:** "Sin estado" = 6 contratos con `initial_value = 0` y status vacío en CSV: `013-2022`, `082-2023`, `009-2024`, `028-2025`, `038-2025`, `170-2025`. Probablemente contratos en proceso de formalización al momento de exportar el Excel.

### Lista completa de contratos EN_EJECUCION (116 activos esperados)

#### 2024 (3 activos)
| N° Contrato | Supervisor | Valor Inicial |
|-------------|-----------|---------------|
| 025-2024 | Ruby Magali España Ruales | $358,824,517 |
| 029-2024 | Humberto Alejandro Yate Lozada | $0 ⚠️ |
| 045-2024 | Edgar Orlando Ramirez Escobar | $100,000,000 |

#### 2025 (77 activos)
| N° Contrato | Supervisor | Valor Inicial |
|-------------|-----------|---------------|
| 001-2025 | Ruby Magali España Ruales | $50,000,000 |
| 002-2025 | Juan Sebastian Obando Cuesta | $66,000,000 |
| 003-2025 | Fabian Andres Cuesta Cantor | $50,000,000 |
| 004-2025 | Edgar Orlando Ramirez Escobar | $66,000,000 |
| 005-2025 | Juan Sebastian Obando Cuesta | $27,000,000 |
| 008-2025 | Jair Antonio Vargas Camargo | $50,000,000 |
| 009-2025 | Ruby Magali España Ruales | $20,000,000 |
| 011-2025 | Ruby Magali España Ruales | $20,000,000 |
| 012-2025 | Edgar Orlando Ramirez Escobar | $66,000,000 |
| 017-2025 | Carlos Arturo Bello Bonilla | $27,000,000 |
| 021-2025 | Juan Sebastian Obando Cuesta | $24,000,000 |
| 022-2025 | Jair Antonio Vargas Camargo | $38,000,000 |
| 026-2025 | Edgar Orlando Ramirez Escobar | $19,000,000 |
| 029-2025 | Carlos Arturo Bello Bonilla | $50,000,000 |
| 030-2025 | Juan Sebastian Obando Cuesta | $24,000,000 |
| 032-2025 | Ruby Magali España Ruales | $55,000,000 |
| 035-2025 | Jair Antonio Vargas Camargo | $97,500,000 |
| 037-2025 | Ruby Magali España Ruales | $27,000,000 |
| 040-2025 | Juan Sebastian Obando Cuesta | $27,000,000 |
| 043-2025 | Ruby Magali España Ruales | $72,000,000 |
| 046-2025 | Ruby Magali España Ruales | $84,000,000 |
| 051-2025 | Ruby Magali España Ruales | $27,000,000 |
| 052-2025 | Carlos Arturo Bello Bonilla | $25,000,000 |
| 054-2025 | Juan Sebastian Obando Cuesta | $19,000,000 |
| 055-2025 | Ruby Magali España Ruales | $74,681,271 |
| 057-2025 | Luis Camilo Torres Hernandez | $33,000,000 |
| 058-2025 | Juan Sebastian Obando Cuesta | $19,000,000 |
| 062-2025 | Ruby Magali España Ruales | $12,000,000 |
| 064-2025 | Luis Camilo Torres Hernandez | $19,000,000 |
| 065-2025 | Edgar Orlando Ramirez Escobar | $21,600,000 |
| 072-2025 | Ruby Magali España Ruales | $211,836,207 |
| 081-2025 | Juan Sebastian Obando Cuesta | $15,200,000 |
| 082-2025 | Juan Sebastian Obando Cuesta | $15,200,000 |
| 084-2025 | Carlos Arturo Bello Bonilla | $20,000,000 |
| 085-2025 | Edgar Orlando Ramirez Escobar | $20,000,000 |
| 086-2025 | Carlos Arturo Bello Bonilla | $20,000,000 |
| 102-2025 | Edgar Orlando Ramirez Escobar | $22,800,000 |
| 105-2025 | Carlos Arturo Bello Bonilla | $9,600,000 |
| 108-2025 | Carlos Arturo Bello Bonilla | $12,000,000 |
| 110-2025 | Edgar Orlando Ramirez Escobar | $12,560,000 |
| 111-2025 | Edgar Orlando Ramirez Escobar | $19,760,000 |
| 112-2025 | Ruby Magali España Ruales | $12,560,000 |
| 116-2025 | Ruby Magali España Ruales | $19,000,000 |
| 117-2025 | Edgar Orlando Ramirez Escobar | $25,000,000 |
| 118-2025 | Edgar Orlando Ramirez Escobar | $19,000,000 |
| 119-2025 | Edgar Orlando Ramirez Escobar | $6,000,000 |
| 122-2025 | Fabian Andres Cuesta Cantor | $17,353,333 |
| 139-2025 | Carlos Arturo Bello Bonilla | $15,200,000 |
| 140-2025 | Edgar Orlando Ramirez Escobar | $8,000,000 |
| 141-2025 | Edgar Orlando Ramirez Escobar | $15,200,000 |
| 142-2025 | Carlos Arturo Bello Bonilla | $20,000,000 |
| 143-2025 | Edgar Orlando Ramirez Escobar | $8,000,000 |
| 144-2025 | Edgar Orlando Ramirez Escobar | $10,800,000 |
| 145-2025 | Edgar Orlando Ramirez Escobar | $9,600,000 |
| 147-2025 | Edgar Orlando Ramirez Escobar | $8,000,000 |
| 148-2025 | Carlos Arturo Bello Bonilla | $10,800,000 |
| 149-2025 | Edgar Orlando Ramirez Escobar | $10,800,000 |
| 152-2025 | Juan Sebastian Obando Cuesta | $14,060,000 |
| 153-2025 | Juan Sebastian Obando Cuesta | $17,666,666 |
| 157-2025 | Carlos Arturo Bello Bonilla | $8,480,000 |
| 159-2025 | Ruby Magali España Ruales | $13,173,333 |
| 160-2025 | Carlos Arturo Bello Bonilla | $9,360,000 |
| 161-2025 | Edgar Orlando Ramirez Escobar | $6,866,667 |
| 163-2025 | Edgar Orlando Ramirez Escobar | $6,866,667 |
| 165-2025 | Edgar Orlando Ramirez Escobar | $8,100,000 |
| 173-2025 | Carlos Arturo Bello Bonilla | $15,000,000 |
| 178-2025 | Edgar Orlando Ramirez Escobar | $6,000,000 |
| 182-2025 | Juan Sebastian Obando Cuesta | $10,260,000 |
| 183-2025 | Edgar Orlando Ramirez Escobar | $13,500,000 |
| 184-2025 | Edgar Orlando Ramirez Escobar | $6,480,000 |
| 185-2025 | Edgar Orlando Ramirez Escobar | $6,750,000 |
| 186-2025 | Edgar Orlando Ramirez Escobar | $5,133,333 |
| 190-2025 | Edgar Orlando Ramirez Escobar | $3,600,000 |
| 191-2025 | Juan Sebastian Obando Cuesta | $10,640,000 |
| 195-2025 | Carlos Arturo Bello Bonilla | $4,860,000 |
| 200-2025 | Edgar Orlando Ramirez Escobar | $29,700,000 |
| 207-2025 | Cornelio Mauricio Alexander Co... | $933,333 |
| **2025 SUSPENDIDOS:** 113-2025 (Ruby Magali España Ruales, $25M) y 158-2025 (Edgar Ramirez, $8.24M) | | |

#### 2026 (36 activos)
| N° Contrato | Supervisor | Valor Inicial |
|-------------|-----------|---------------|
| 001-2026 | Jair Antonio Vargas Camargo | $20,600,000 |
| 002-2026 | Juan Sebastian Obando Cuesta | $27,192,000 |
| 003-2026 | Juan Sebastian Obando Cuesta | $10,176,000 |
| 004-2026 | Juan Sebastian Obando Cuesta | $15,656,000 |
| 005-2026 | Juan Sebastian Obando Cuesta | $15,656,000 |
| 006-2026 | Juan Sebastian Obando Cuesta | $20,600,000 |
| 011-2026 | Jair Antonio Vargas Camargo | $15,656,000 |
| 028-2026 | Ruby Magali España Ruales | $8,480,000 |
| 029-2026 | Carlos Arturo Bello Bonilla | $10,176,000 |
| 032-2026 | Carlos Arturo Bello Bonilla | $11,124,000 |
| 033-2026 | Carlos Arturo Bello Bonilla | $20,600,000 |
| 037-2026 | Ruby Magali España Ruales | $8,480,000 |
| 040-2026 | Cornelio Mauricio Alexander Co... | $20,600,000 |
| 043-2026 | Ruby Magali España Ruales | $20,600,000 |
| 046-2026 | Juan Sebastian Obando Cuesta | $11,124,000 |
| 049-2026 | Juan Sebastian Obando Cuesta | $11,124,000 |
| 053-2026 | Ruby Magali España Ruales | $15,656,000 |
| 054-2026 | Jair Antonio Vargas Camargo | $10,176,000 |
| 055-2026 | Ruby Magali España Ruales | $15,656,000 |
| 056-2026 | Ruby Magali España Ruales | $10,176,000 |
| 058-2026 | Jair Antonio Vargas Camargo | $15,656,000 |
| 059-2026 | Juan Sebastian Obando Cuesta | $22,660,000 |
| 060-2026 | Cornelio Mauricio Alexander Co... | $10,176,000 |
| 061-2026 | Fabian Andres Cuesta Cantor | $20,600,000 |
| 063-2026 | Fabian Andres Cuesta Cantor | $15,656,000 |
| 065-2026 | Edgar Orlando Ramirez Escobar | $24,720,000 |
| 066-2026 | Cornelio Mauricio Alexander Co... | $15,656,000 |
| 068-2026 | Cornelio Mauricio Alexander Co... | $11,124,000 |
| 069-2026 | Cornelio Mauricio Alexander Co... | $15,656,000 |
| 071-2026 | Ruby Magali España Ruales | $8,480,000 |
| 072-2026 | Ruby Magali España Ruales | $34,608,000 |
| 073-2026 | Ruby Magali España Ruales | $10,176,000 |
| 074-2026 | Jair Antonio Vargas Camargo | $20,600,000 |
| 079-2026 | Juan Sebastian Obando Cuesta | $11,124,000 |
| 080-2026 | Jair Antonio Vargas Camargo | $34,608,000 |
| 081-2026 | Jair Antonio Vargas Camargo | $27,192,000 |

---

## FUENTE B — Supabase BD

### Hallazgo crítico del análisis de scripts

Del análisis de los archivos de importación (`parte_2_contracts_1.sql`, `parte_3_contracts_2.sql`):

| Archivo | Contratos FUNCIONAMIENTO importados |
|---------|-----------------------------------|
| parte_2_contracts_1.sql | 202 contratos (2021-2025 parcial) |
| parte_3_contracts_2.sql | 83 contratos (2025-2026) |
| **Total import** | **285 contratos** |

> **Discrepancia:** 285 en import vs 284 en Excel. Un contrato extra. Puede ser un duplicado, un contrato añadido manualmente post-Excel, o diferencia de criterio de filtrado.

### Estado de project_id en los contratos importados

**El import SQL NO asigna `project_id`** a ningún contrato de funcionamiento.

El `project_id` debería haberse asignado en el **backfill V3** (según `EPUXUA_ARQUITECTURA_V3.md §3.6`):
```
DIRECTO + funcionamiento → Proyecto FUNCIONAMIENTO-{year}; contratos OPERATIVO
```

Pero **no existe ningún script SQL en el repositorio que ejecute ese UPDATE**.

Los scripts existentes que podrían haberlo hecho:
- `EPUXUA_DDL.sql` — No contiene UPDATE de project_id para funcionamiento
- `parte_4_parents_interadmin_pcf.sql` — Solo actualiza parent_contract_id (0 referencias a project_id)
- `parte_8_recalculate_validate.sql` — No referencia project_id ni FUNCIONAMIENTO
- `EPUXUA_CONTRACT_HIERARCHY.sql` — Solo actualiza contract_type a DERIVADO

### Hipótesis del estado actual

**HIPÓTESIS A (probable):** El backfill V3 fue ejecutado manualmente en el SQL Editor de Supabase (no está en el repositorio git). En ese caso:
- Los proyectos FUNCIONAMIENTO-2021 a FUNCIONAMIENTO-2026 existen
- Los contratos tienen project_id apuntando a esos proyectos
- `getFuncionamientoContracts()` muestra todos los contratos

**HIPÓTESIS B (posible):** El backfill V3 no fue ejecutado o solo fue parcial. En ese caso:
- Los contratos migrados tienen project_id = NULL
- `getFuncionamientoContracts()` retorna vacío para contratos históricos
- El módulo solo muestra contratos creados desde la UI (con project_id asignado en la creación)

---

## FUENTE C — Frontend `getFuncionamientoContracts()`

### Lógica actual del servicio

```typescript
// Paso 1: busca proyectos FUNCIONAMIENTO
const { data: projects } = await supabase
  .from("projects")
  .select("id, project_code, year")
  .eq("project_type", "FUNCIONAMIENTO")

// Paso 2: busca contratos con esos project_ids
const { data: contractRefs } = await supabase
  .from("contracts")
  .select("id, project_id")
  .in("project_id", projectIds)

// Paso 3: detalles via v_contract_detail
const { data } = await supabase
  .from("v_contract_detail")
  .select("*")
  .in("id", contractIds)
```

### Consecuencias por hipótesis

| Hipótesis | Proyectos FUNCIONAMIENTO | Contratos con project_id | getFuncionamientoContracts() |
|-----------|-------------------------|--------------------------|------------------------------|
| **A** (backfill ejecutado) | 6 proyectos (2021-2026) | 285 contratos | Muestra los 285 |
| **B** (backfill NO ejecutado) | 0 o pocos proyectos | 0 o pocos contratos | Muestra 0 o parcial |
| **C** (parcial) | Algunos años | Solo los del año backfilleado | Muestra fracción |

---

## Comparativo de las Tres Fuentes

> **Este cuadro debe completarse con los resultados de las queries SQL en Supabase.**

| Indicador | Excel [A] | BD [B] | Frontend [C] | Diferencia A-C |
|-----------|-----------|---------|-------------|---------------|
| Total contratos | 284 | a confirmar | a confirmar | **a confirmar** |
| EN_EJECUCION | 116 | a confirmar | a confirmar | **a confirmar** |
| 2021 | 5 | a confirmar | a confirmar | — |
| 2022 | 24 | a confirmar | a confirmar | — |
| 2023 | 58 | a confirmar | a confirmar | — |
| 2024 | 77 | a confirmar | a confirmar | — |
| 2025 | 84 | a confirmar | a confirmar | — |
| 2026 | 36 | a confirmar | a confirmar | — |
| Sin project_id | 0 | a confirmar | — | — |

---

## Categorías de Anomalías Identificadas (desde CSV)

### 1. Contratos con valor = $0 (6 registros)
Probable causa: contratos en proceso de registro al momento del corte del Excel.

| N° Contrato | Año | Status | Supervisor |
|-------------|-----|--------|------------|
| 013-2022 | 2022 | SIN_ESTADO | Mercedes Rodriguez |
| 082-2023 | 2023 | SIN_ESTADO | Carlos Arturo Bello Bonilla |
| 009-2024 | 2024 | SIN_ESTADO | Libia Yolanda Lozano Gonzalez |
| 028-2025 | 2025 | SIN_ESTADO | Edgar Orlando Ramirez Escobar |
| 038-2025 | 2025 | SIN_ESTADO | Ruby Magali España Ruales |
| 170-2025 | 2025 | SIN_ESTADO | Carlos Arturo Bello Bonilla |

> **Nota:** El contrato `029-2024` (EN_EJECUCION, Humberto Alejandro Yate, $0) también tiene valor cero pero tiene estado definido — caso especial a investigar.

### 2. Contratos DIRECTO con resource_type diferente a FUNCIONAMIENTO (excluir del dashboard)
| resource_type | Cantidad | Acción |
|---------------|----------|--------|
| GASTO DE OPERACIÓN COMERCIAL | 134 | Excluir — no es funcionamiento EPUXUA |
| INVERSIÓN | 12 | Excluir — contratos de inversión vía mandato |
| TRANSFERENCIAS MUNICIPALES | 4 | Excluir |
| Otros (Galeria, Sistemas, etc.) | 6 | Excluir o reclasificar |

### 3. Discrepancia import vs Excel: 285 vs 284

El import SQL tiene 1 contrato más que el Excel. Requiere identificar cuál es el extra.

---

## Supervisores de Funcionamiento (top por contratos activos 2025-2026)

| Supervisor | Contratos activos |
|------------|-------------------|
| Ruby Magali España Ruales | ~25 |
| Edgar Orlando Ramirez Escobar | ~23 |
| Juan Sebastian Obando Cuesta | ~15 |
| Carlos Arturo Bello Bonilla | ~12 |
| Jair Antonio Vargas Camargo | ~8 |
| Luis Camilo Torres Hernandez | ~3 |
| Fabian Andres Cuesta Cantor | ~3 |
| Cornelio Mauricio Alexander Correa | ~5 |

---

## Queries SQL para Ejecutar en Supabase

**Archivo:** `AUDIT_FUNCIONAMIENTO_QUERIES.sql`

Ejecutar en orden las secciones 1-14 en el SQL Editor de Supabase y documentar los resultados aquí.

### Resultados esperados por sección

| Sección | Pregunta | Resultado esperado |
|---------|---------|-------------------|
| 1 | ¿Cuántos contratos de cada tipo? | DIRECTO: ~440, DERIVADO: ~173, INTERADMINISTRATIVO: ~65 |
| 2 | ¿Contratos FUNCIONAMIENTO en BD? | ~284-285 |
| 3 | ¿Resumen totales FUNCIONAMIENTO? | Total: ~285, EN_EJECUCION: ~116 |
| 4 | ¿Por año? | 2021:5, 2022:24, 2023:58, 2024:77, 2025:84, 2026:36 |
| 5 | ¿Proyectos contenedor? | 0-6 proyectos FUNCIONAMIENTO |
| 6 | ¿Contratos visibles en frontend? | 0-285 según backfill |
| 7 | ¿Contratos huérfanos (sin project_id)? | **Clave: si > 0, el módulo tiene faltantes** |
| 8 | ¿Contratos extraños en proyectos FUNC? | 0 esperado |
| 9A | ¿Activos en BD? | ~116 |
| 9B | ¿Activos visibles en frontend? | 0-116 |
| 12 | ¿Enum DERIVADO existe? | Debe incluir DERIVADO |
| 14 | Resumen final | Tabla comparativa A vs B vs C |

---

## Instrucciones para Completar la Auditoría

1. Abrir Supabase → SQL Editor → New Query
2. Copiar el contenido de `AUDIT_FUNCIONAMIENTO_QUERIES.sql`
3. Ejecutar **una sección a la vez** (identificadas con comentarios `-- SECCIÓN N`)
4. Copiar los resultados y pegarlos en este documento bajo "Resultados Confirmados"
5. Con los resultados, generar el comparativo final y aprobar la Fase 1

---

## Decisión de Diseño Confirmada

> **Los proyectos contenedor `FUNCIONAMIENTO-AAAA` se mantienen internamente pero NO son visibles para el usuario final.**

Implicaciones:
- No aparecen en Dashboard, Kanban, ni navegación principal
- `getFuncionamientoContracts()` puede seguir usando el paso por proyectos contenedor (es solo una abstracción técnica de BD)
- El módulo `/funcionamiento` muestra **contratos**, no proyectos
- Los KPIs del Dashboard muestran métricas de **contratos**, no de proyectos contenedor
- La única acción que sí puede crear proyectos contenedor automáticamente es `createFuncionamientoContract()` — de forma transparente para el usuario

---

## Próximos pasos

1. ✅ **Auditoría estática CSV** — Completada (284 contratos identificados)
2. 🔲 **Ejecutar queries SQL en Supabase** — Camila ejecuta `AUDIT_FUNCIONAMIENTO_QUERIES.sql`
3. 🔲 **Completar el comparativo** con resultados reales de BD
4. 🔲 **Confirmar hipótesis** A, B o C
5. 🔲 **Aprobar Fase 1** de implementación con datos confirmados
