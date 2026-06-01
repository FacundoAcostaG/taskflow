# Hito 3 — Equipo Acosta

---

## ✅ Lo que estuvo muy bien

- **Lint impecable:** 0 errores (14 warnings menores de tipo `console`/`any`). El codebase cumple todas las reglas de ESLint configuradas.
- **TypeScript compila sin errores:** `tsc --noEmit` termina limpiamente en `apps/api`.
- **Tests unitarios sólidos:** 26 tests unitarios (auth.service + task.state-machine) pasan. El setup de mocks en `tests/integration/auth.routes.spec.ts` y `tasks.routes.spec.ts` está bien estructurado con `vi.mock` y acceso correcto al mock instance.
- **Calidad de escritura Gherkin:** Las tres feature files (`auth.feature`, `projects.feature`, `tasks.feature`) tienen escenarios bien redactados — Given/When/Then describen comportamiento del usuario, no implementación. Cada US nueva tiene al menos un happy path y un escenario de error.
- **Estructura del test Pact consumer:** `createProject.consumer.pact.test.ts` demuestra buen entendimiento de PactV4, usa `MatchersV3.uuid()` y `MatchersV3.string()` correctamente, e importa la función real del cliente desde `api/src/projects.ts`.
- **BUG-06 detectado y documentado:** El equipo documentó el bug de `archived: false` en `project.service.ts` línea 42 y lo tiene aplicado correctamente en la query.

---

## ❌ Lo que no estuvo bien

### [A] Integration tests US-03/04/05

**US-03 y US-04 — 0 pts:**
Los tests están escritos en `apps/api/tests/project.integration.test.ts` pero el script `test:integration` ejecuta `vitest run tests/integration` (subcarpeta distinta). Esos tests **no son recogidos por el script oficial**. Adicionalmente, tienen rutas incorrectas (falta el prefijo `/api/`). Todos los tests de US-03/04 fallan al correrlos: `TypeError: Cannot read properties of undefined (reading 'id')` porque `/auth/register` devuelve 404.

**US-05 — parcial (2/8):**
En `tests/integration/tasks.routes.spec.ts` (sí recogido por el script):
- Happy path 201 **pasa** pero solo verifica `id` y `title`, no `priority` → 2/3 pts
- "400 — título vacío" **falla** con 404 porque la ruta es `/projects/proj-1/tasks` en lugar de `/api/projects/proj-1/tasks`
- No hay test para prioridad inválida ni para status inicial distinto de TODO

**Assertion invertida en US-04:** `expect(list.body.projects).toBeUndefined()` solo verifica que la respuesta no esté envuelta en `{projects: []}`, no que el segundo usuario no vea proyectos del primero.

### [B] Gherkin — todos los escenarios fallan

**Error crítico: step definitions duplicadas.** El mismo texto aparece definido en los tres archivos de steps:

```
la respuesta tiene código de estado {int}
  → auth.steps.js:101 | projects.steps.js:76 | tasks.steps.js:63

el cuerpo contiene {string} con valor {string}
  → auth.steps.js:112 | projects.steps.js:80 | tasks.steps.js:83
```

Cucumber no puede resolver cuál usar y arroja **"Multiple step definitions match"** para los 14 escenarios. Resultado: **0 de 14 escenarios pasan**.

Además, el script `test:bdd` del root (`npm run test:bdd --workspace=apps/api`) apunta a `apps/api` donde no hay features, por lo que reporta `0 scenarios / 0 steps`. Los features están en `taskflow-bdd/`.

Los steps son stubs (no llaman la API real), pero incluso sin el problema de ambigüedad, los escenarios de error (email duplicado → 409, contraseña corta → 400, nombre vacío → 400) fallarían porque el When devuelve siempre la respuesta hardcodeada de éxito.

### [C] Pact — no funciona en ningún lado

**Consumer:** El test existe pero falla con `Error: Failed to load url @pact-foundation/pact` porque el package no es accesible desde el entorno de Vite. **No se generó ningún archivo** `pacts/taskflow-frontend-taskflow-api.json`.

**Provider:** `npm run test:pact --workspace=apps/api` reporta `No test files found` — no existe ningún test de verificación de provider en `apps/api/tests/pact/`.

### [D] Coverage

Lines coverage: **36.7%** (umbral requerido: ≥ 70%). Los unit tests solo cubren `auth.service` y `task.state-machine`. Todas las rutas, middleware y los servicios `ProjectService` y `CommentService` tienen 0% de cobertura.

---

## Calificación

| Sección | Ítem | Pts obtenidos | Pts máx |
|---------|------|:---:|:---:|
| **A. Endpoints + integration tests** | US-03 POST /api/projects — tests no corren (carpeta incorrecta + rutas equivocadas) | 0 | 9 |
| | US-04 GET /api/projects — tests no corren (mismos problemas) | 0 | 8 |
| | US-05 POST /api/projects/:id/tasks — happy path pasa sin verificar priority; errores no cubiertos o fallan | 2 | 8 |
| **B. Gherkin US-01..05** | US-01 — 0/4 escenarios pasan (ambiguous) | 0 | 7 |
| | US-02 — 0/2 escenarios pasan (ambiguous) | 0 | 7 |
| | US-03 — 0/2 escenarios pasan (ambiguous) | 0 | 7 |
| | US-04 — 0/2 escenarios pasan (ambiguous) | 0 | 7 |
| | US-05 — 0/4 escenarios pasan (ambiguous) | 0 | 7 |
| **C. Contrato Pact** | Consumer — test falla, no genera `pacts/*.json` | 0 | 10 |
| | Provider — no existe archivo de verificación | 0 | 10 |
| **D. Calidad** | Lint — 0 errores (14 warnings) | 7 | 7 |
| | TypeScript — `tsc --noEmit` sin errores | 6 | 6 |
| | Coverage — 36.7% líneas (< 70%) | 0 | 7 |
| **TOTAL** | | **15** | **100** |

**Nota:** (15/100)

---
---

# Feedback para el equipo — Cómo corregir cada problema

Buen trabajo en la parte de calidad de código base: lint y TypeScript sin errores, y los unit tests existentes son sólidos. Los problemas que afectaron la nota son todos corregibles — en la mayoría de los casos el código conceptualmente está bien y el error es de configuración o de un detalle puntual. Acá va el detalle punto por punto.

---

## Problema 1 — Integration tests: carpeta incorrecta

**Qué pasó:** Escribieron `project.integration.test.ts` y `task.integration.test.ts` en `apps/api/tests/`, pero el script `test:integration` del package.json ejecuta `vitest run tests/integration`. Vitest solo busca archivos bajo esa subcarpeta, así que sus tests nunca fueron ejecutados.

**Cómo arreglarlo:**

```bash
mv apps/api/tests/project.integration.test.ts apps/api/tests/integration/
mv apps/api/tests/task.integration.test.ts    apps/api/tests/integration/
```

Luego verificar que corran:
```bash
npm run test:integration
```

---

## Problema 2 — Integration tests: rutas incorrectas

**Qué pasó:** En `project.integration.test.ts` y `task.integration.test.ts` las llamadas HTTP no tienen el prefijo `/api/`. Por ejemplo:

```typescript
// ❌ incorrecto — devuelve 404
await request(app).post('/auth/register').send(...)
await request(app).post('/projects').send(...)
await request(app).get('/projects').set(...)
await request(app).post(`/projects/${projectId}/tasks`).send(...)
```

Mirando `app.ts`, las rutas están registradas así:
```typescript
app.use('/api/auth', authRoutes)
app.use('/api/projects', projectRoutes)
```

**Cómo arreglarlo:** Agregar el prefijo `/api/` en cada llamada:

```typescript
// ✅ correcto
await request(app).post('/api/auth/register').send(...)
await request(app).post('/api/projects').send(...)
await request(app).get('/api/projects').set(...)
await request(app).post(`/api/projects/${projectId}/tasks`).send(...)
```

El mismo problema existe en `tasks.routes.spec.ts` línea 79 — el test "400 — título vacío" usa `/projects/proj-1/tasks` en lugar de `/api/projects/proj-1/tasks`.

---

## Problema 3 — Integration tests: assertion invertida en US-04

**Qué pasó:** El test de aislamiento de usuarios dice:

```typescript
expect(list.body.projects).toBeUndefined();
```

Esta assertion siempre pasa porque la ruta devuelve un array directo (`res.json(projects)`), entonces `list.body` es `[]` y `list.body.projects` es siempre `undefined`. No verifica aislamiento.

**Cómo arreglarlo:** Verificar que el usuario 2 no vea el proyecto del usuario 1:

```typescript
it('solo devuelve los proyectos del usuario autenticado (@US-04)', async () => {
  // Crear proyecto del primer usuario
  await request(app).post('/api/projects')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Proyecto de tester1' });

  // Registrar segundo usuario
  const res2 = await request(app).post('/api/auth/register')
    .send({ email: 'otro@test.com', password: 'Test1234!' });
  const token2 = res2.body.token;

  // El segundo usuario lista SUS proyectos
  const list = await request(app).get('/api/projects')
    .set('Authorization', `Bearer ${token2}`);

  expect(list.status).toBe(200);
  // ✅ el usuario 2 no tiene proyectos propios → lista vacía
  expect(Array.isArray(list.body)).toBe(true);
  expect(list.body).toHaveLength(0);
});
```

---

## Problema 4 — Integration test US-05: no se verifica `priority`

**Qué pasó:** En `tasks.routes.spec.ts`, el test del happy path verifica `id` y `title`, pero no `priority`:

```typescript
expect(res.status).toBe(201)
expect(res.body.id).toBeDefined()
expect(res.body.title).toBe('Implementar Login')
// ← falta verificar priority
```

**Cómo arreglarlo:**

```typescript
expect(res.status).toBe(201)
expect(res.body.id).toBeDefined()
expect(res.body.priority).toBe('HIGH')   // ← agregar esto
```

---

## Problema 5 — BDD: step definitions duplicadas (problema principal)

**Qué pasó:** Los tres archivos de steps definen exactamente el mismo texto:

```
la respuesta tiene código de estado {int}
el cuerpo contiene {string} con valor {string}
```

Cucumber no sabe cuál usar y falla con `Multiple step definitions match` en los 14 escenarios. Resultado: 0 de 14 escenarios ejecutados correctamente.

**Cómo arreglarlo:** Crear un archivo compartido con los steps genéricos y eliminarlos de los otros tres archivos.

```javascript
// features/step_definitions/shared.steps.js  ← NUEVO archivo
const { Then } = require('@cucumber/cucumber');
const { expect } = require('chai');

Then('la respuesta tiene código de estado {int}', function (expectedStatus) {
  expect(this.response).to.not.be.null;
  expect(this.response.status).to.equal(expectedStatus);
});

Then('el cuerpo contiene el campo {string}', function (field) {
  expect(this.response.data).to.have.property(field);
});

Then('el cuerpo contiene {string} con valor {string}', function (field, value) {
  expect(String(this.response.data[field])).to.equal(value);
});
```

Para que `this.response` sea accesible desde todos los steps, guardar la respuesta en `this` (el World object de Cucumber) en lugar de una variable de módulo:

```javascript
// En auth.steps.js, projects.steps.js y tasks.steps.js:
When('el usuario envía los datos de registro:', async function (dataTable) {
  const data = dataTable.rowsHash();
  this.response = { status: 201, data: { id: 'test-id', email: data.email } };
  //  ^^^^ guardar en this, no en variable local del módulo
});
```

Luego, eliminar las definiciones duplicadas de `la respuesta tiene código de estado` y `el cuerpo contiene` de `auth.steps.js`, `projects.steps.js` y `tasks.steps.js`.

---

## Problema 6 — BDD: el script `test:bdd` apunta al lugar equivocado

**Qué pasó:** El `package.json` raíz tiene:
```json
"test:bdd": "npm run test:bdd --workspace=apps/api"
```

Cuando Cucumber corre en `apps/api/`, no encuentra ninguna carpeta `features/` ahí y reporta `0 scenarios`. Los features están en `taskflow-bdd/`.

**Cómo arreglarlo:** Cambiar el script en el `package.json` raíz:

```json
"test:bdd": "cd taskflow-bdd && npm test"
```

O, si prefieren mantener todo desde el raíz, configurar cucumber en `apps/api/` para que apunte a las features de `taskflow-bdd/` creando el archivo `apps/api/cucumber.cjs`:

```javascript
module.exports = {
  default: {
    paths: ['../../taskflow-bdd/features/**/*.feature'],
    require: ['../../taskflow-bdd/features/step_definitions/**/*.js'],
    format: ['progress'],
  }
};
```

---

## Problema 7 — BDD: los steps son stubs que no llaman la API real

**Qué pasó:** Los steps del tipo When tienen respuestas hardcodeadas en lugar de llamar a la API:

```javascript
// ❌ stub — siempre devuelve 201 sin importar el input
When('el usuario envía los datos de registro:', async function (dataTable) {
  const data = dataTable.rowsHash();
  response = { status: 201, data: { id: 'test-id', email: data.email } };
});
```

Esto hace que los escenarios de error (email duplicado → 409, contraseña corta → 400) fallen aunque el servidor funcione correctamente.

**Cómo arreglarlo:** Descomentar las llamadas reales a la API. Requiere que el servidor esté corriendo durante los tests:

```javascript
When('el usuario envía los datos de registro:', async function (dataTable) {
  const data = dataTable.rowsHash();
  // ✅ llamada real al servidor
  this.response = await api.post('/api/auth/register', {
    email: data.email,
    password: data.password,
    name: data.name,
  });
});
```

Para los steps de Given que limpian la base de datos o crean precondiciones, la opción más simple es agregar un endpoint de reset solo disponible en entorno de test:

```typescript
// En app.ts, solo si NODE_ENV === 'test':
if (process.env.NODE_ENV === 'test') {
  app.post('/test/reset', async (_req, res) => {
    await prisma.task.deleteMany()
    await prisma.project.deleteMany()
    await prisma.user.deleteMany()
    res.json({ ok: true })
  })
}
```

Y en el step:
```javascript
Given('la base de datos está limpia', async function () {
  await api.post('/test/reset');
});
```

---

## Problema 8 — Pact consumer: el package no resuelve en apps/web

**Qué pasó:** `@pact-foundation/pact` usa módulos nativos compilados (binarios `.node`) y **no es compatible con el entorno de browser de Vite/jsdom**. Necesita correr en Node.js puro.

**Cómo arreglarlo:** Crear una configuración de Vitest que use entorno Node para los tests de Pact:

```typescript
// apps/web/vitest.config.ts  ← crear este archivo
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',   // ← clave: no jsdom
    include: ['tests/pact/**/*.test.ts'],
  },
})
```

También crear la carpeta de salida antes de correr el test:
```bash
mkdir -p pacts
```

Y verificar que el path en el test sea correcto:
```typescript
const provider = new PactV4({
  consumer: 'taskflow-frontend',
  provider: 'taskflow-api',
  dir: path.resolve(__dirname, '../../../../pacts'),  // relativo a apps/web/tests/pact/
});
```

---

## Problema 9 — Pact provider: no existe el test de verificación

**Qué pasó:** `apps/api/package.json` tiene el script `test:pact` que ejecuta `vitest run tests/pact`, pero esa carpeta está vacía. No hay ningún test de verificación del provider.

**Cómo arreglarlo:** Una vez que el consumer genera el pact file (Problema 8), crear el test de verificación:

```typescript
// apps/api/tests/pact/provider.pact.spec.ts
import { describe, it } from 'vitest'
import { Verifier } from '@pact-foundation/pact'
import path from 'path'
import { createApp } from '../../src/app'
import http from 'http'

describe('Pact Provider Verification', () => {
  it('verifica el contrato contra taskflow-frontend', async () => {
    const app = createApp()
    const server = http.createServer(app)
    await new Promise<void>(resolve => server.listen(0, resolve))
    const port = (server.address() as any).port

    await new Verifier({
      provider: 'taskflow-api',
      providerBaseUrl: `http://localhost:${port}`,
      pactUrls: [
        path.resolve(__dirname, '../../../../pacts/taskflow-frontend-taskflow-api.json')
      ],
      stateHandlers: {
        'usuario autenticado con token válido': async () => {
          // Crear usuario de prueba y retornar el token
          // para que el provider pueda procesar las requests del contrato
        },
      },
    }).verifyProvider()

    await new Promise<void>(resolve => server.close(() => resolve()))
  })
})
```

---

## Problema 10 — Coverage: 36.7% líneas (umbral: 70%)

**Qué pasó:** Los unit tests solo cubren `auth.service.ts` y `task.state-machine`. El layer de rutas, middleware y los servicios `ProjectService` y `CommentService` tienen 0% de cobertura:

```
app.ts              0%
project.routes.ts   0%
task.routes.ts      0%
auth.middleware.ts  0%
project.service.ts  0%
comment.service.ts  0%
```

**Cómo arreglarlo — Opción A (agregar unit tests para los servicios faltantes):**

```typescript
// apps/api/tests/unit/project.service.spec.ts
import { describe, it, expect, vi } from 'vitest'
import { ProjectService } from '../../src/services/project.service'

const mockPrisma = {
  project: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
}

describe('ProjectService', () => {
  const service = new ProjectService(mockPrisma as any)

  it('createProject: crea y devuelve el proyecto', async () => {
    mockPrisma.project.findFirst.mockResolvedValue(null)
    mockPrisma.project.create.mockResolvedValue({
      id: 'proj-1', name: 'Test', ownerId: 'user-1'
    })
    const result = await service.createProject('user-1', { name: 'Test' })
    expect(result.id).toBe('proj-1')
  })

  it('createProject: lanza ConflictError si el nombre ya existe', async () => {
    mockPrisma.project.findFirst.mockResolvedValue({ id: 'existing' })
    await expect(
      service.createProject('user-1', { name: 'Duplicado' })
    ).rejects.toThrow('Project name already exists')
  })
})
```

**Cómo arreglarlo — Opción B (incluir coverage en los integration tests):**

Cambiar en `apps/api/package.json`:
```json
"test:integration": "vitest run tests/integration --coverage"
```

Con los integration tests bien implementados (llamando la API real), la cobertura sube considerablemente porque ejercitan rutas, middleware y servicios juntos en una sola ejecución.

---

## Resumen de prioridades

| Prioridad | Problema | Impacto en nota |
|-----------|----------|:---:|
| 🔴 Alta | BDD: extraer step definitions duplicadas a `shared.steps.js` | +35 pts potenciales |
| 🔴 Alta | Integration: mover tests a `tests/integration/` y agregar prefijo `/api/` | +17 pts |
| 🟡 Media | BDD: implementar steps reales (descomentar llamadas a la API) | necesario para escenarios de error |
| 🟡 Media | Pact consumer: agregar `vitest.config.ts` con `environment: 'node'` | +10 pts |
| 🟡 Media | Pact provider: crear test de verificación | +10 pts |
| 🟢 Baja | Coverage: agregar unit tests para `ProjectService` y `CommentService` | +7 pts |
| 🟢 Baja | US-04 assertion: verificar aislamiento real con `toHaveLength(0)` | +6 pts |
