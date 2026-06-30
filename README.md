# TaskFlow

[![CI](https://github.com/FacundoAcostaG/taskflow/actions/workflows/ci.yml/badge.svg)](https://github.com/FacundoAcostaG/taskflow/actions/workflows/ci.yml)

Proyecto integrador de **Testing y Calidad de Software**. TaskFlow es una app de gestion de tareas estilo Jira simplificado, montada como monorepo con backend, frontend y varias suites de testing automatizado.

Equipo: **Facundo Acosta** y **Pablo Constantino**

## Que incluye

- API REST con Express + TypeScript + Prisma.
- Frontend web con React 18 + Vite.
- Base de datos PostgreSQL con seed de datos iniciales.
- Tests unitarios, integracion, BDD, E2E, contract testing y mobile.
- Reportes con Allure, Playwright HTML y artefactos de Pact.

## Stack

| Capa             | Tecnologia                     |
| ---------------- | ------------------------------ |
| Backend          | Node.js + Express + TypeScript |
| Frontend         | React 18 + TypeScript + Vite   |
| Persistencia     | Prisma + PostgreSQL            |
| Unit testing     | Vitest                         |
| Integracion API  | Vitest + Supertest             |
| BDD              | Cucumber.js + Gherkin          |
| E2E web          | Playwright                     |
| Contract testing | Pact                           |
| Mobile testing   | WebdriverIO + Appium           |
| Performance      | k6                             |
| CI/CD            | GitHub Actions                 |

## Setup rapido

### Prerrequisitos

- Node.js 20 o superior
- npm
- PostgreSQL disponible en `localhost:5432`
- Bash para correr `setup.sh`

En Windows, lo mas simple es usar **Git Bash** o **WSL** para ejecutar el script de setup.

### Instalacion

```bash
bash setup.sh
npm run dev
```

Esto deja lista la base, genera Prisma y levanta:

- Frontend: [http://localhost:5173](http://localhost:5173)
- API: [http://localhost:3001](http://localhost:3001)
- Healthcheck: [http://localhost:3001/health](http://localhost:3001/health)

### Credenciales seed

| Email                | Contrasena  |
| -------------------- | ----------- |
| `alice@taskflow.dev` | `Password1` |
| `bob@taskflow.dev`   | `Password1` |
| `seed@test.com`      | `Password1` |

## Variables de entorno

El backend usa [`apps/api/.env`](/C:/Users/facun/OneDrive/Escritorio/taskflow/apps/api/.env). Si no existe, `setup.sh` lo crea automaticamente a partir de `.env.example` o con valores por defecto.

Ejemplo esperado:

```env
DATABASE_URL="postgresql://usuario@localhost:5432/taskflow_dev"
JWT_SECRET="taskflow-dev-secret"
PORT=3001
NODE_ENV=development
```

Para tests tambien existe [`apps/api/.env.test`](/C:/Users/facun/OneDrive/Escritorio/taskflow/apps/api/.env.test).

## Scripts principales

### Desarrollo

```bash
npm run dev        # API + frontend
npm run dev:web    # solo frontend
npm run lint
npm run typecheck
npm run format
```

### Testing

```bash
npm run test:unit         # unit tests del backend con coverage
npm run test:integration  # integracion del backend
npm run test:bdd          # escenarios Cucumber en taskflow-bdd/
npm run test:e2e          # Playwright web
npm run test:mobile       # WebdriverIO + Appium
npm run test:all          # unit + integration + bdd + e2e
```

### Reportes

```bash
npm run allure:generate
npm run allure:open
npm run allure:report
```

### Otras suites y herramientas

```bash
npm run test:pact --workspace=apps/api
npm run test:pact --workspace=apps/web
k6 run performance/scenarios/api-load.k6.js
```

## Notas por suite

- `test:e2e` usa la config de [`playwright.config.ts`](/C:/Users/facun/OneDrive/Escritorio/taskflow/playwright.config.ts) y levanta automaticamente API y frontend.
- `test:mobile` requiere Android Emulator, Appium y la app demo configurada en [`mobile/wdio.conf.ts`](/C:/Users/facun/OneDrive/Escritorio/taskflow/mobile/wdio.conf.ts).
- Los tests de performance requieren `k6` instalado localmente.

## Estructura del repo

```text
taskflow/
|-- apps/
|   |-- api/          # API REST, Prisma, tests unit/integration/pact
|   `-- web/          # app React
|-- docs/adr/         # ADRs, trazabilidad y entregables
|-- e2e/              # Playwright (tests y page objects)
|-- mobile/           # automatizacion mobile con WebdriverIO/Appium
|-- performance/      # escenarios k6
|-- pacts/            # artefactos de contract testing
|-- taskflow-bdd/     # features y step definitions de Cucumber
|-- setup.sh          # bootstrap del entorno local
`-- README.md
```

## Rutas principales del frontend

| Ruta                          | Pantalla                       |
| ----------------------------- | ------------------------------ |
| `/register`                   | Registro                       |
| `/login`                      | Login                          |
| `/projects`                   | Lista de proyectos             |
| `/projects/:id`               | Detalle de proyecto y tareas   |
| `/projects/:id/tasks/:taskId` | Detalle de tarea y comentarios |

## Endpoints base del backend

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/projects`
- `GET /api/projects/:id`
- `GET /api/projects/:id/tasks`
- `POST /api/projects/:id/tasks`
- `PATCH /api/tasks/:taskId`
- `GET /api/projects/:id/tasks/:taskId/comments`
- `POST /api/projects/:id/tasks/:taskId/comments`

## Material academico y notas del proyecto

- [`docs/adr/ADR-001-testing-stack.md`](/C:/Users/facun/OneDrive/Escritorio/taskflow/docs/adr/ADR-001-testing-stack.md)
- [`taskflow-bdd/README.md`](/C:/Users/facun/OneDrive/Escritorio/taskflow/taskflow-bdd/README.md)
- [`performance/resultados-clase9.md`](/C:/Users/facun/OneDrive/Escritorio/taskflow/performance/resultados-clase9.md)

## TODOs intencionales

Hay componentes preparados para ejercicios del curso:

- [`apps/web/src/components/TaskCard.tsx`](/C:/Users/facun/OneDrive/Escritorio/taskflow/apps/web/src/components/TaskCard.tsx)
- [`apps/web/src/components/CommentList.tsx`](/C:/Users/facun/OneDrive/Escritorio/taskflow/apps/web/src/components/CommentList.tsx)

Buscando `TODO (estudiante)` vas a encontrar los puntos pendientes.
