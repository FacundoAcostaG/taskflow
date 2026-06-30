# TaskFlow BDD — Scaffold Clase 2

## Setup rápido (< 2 minutos)

```bash
cd taskflow
npm install
npx cucumber-js
```

## Estructura

```
features/
├── auth.feature          EP-01: Autenticación
├── projects.feature      EP-02: Proyectos y Tablero
├── tasks.feature         EP-03: Gestión de Tareas
└── step_definitions/
    ├── auth.steps.js     Steps implementados (funcionales con stubs)
    ├── projects.steps.js Steps en stub
    └── tasks.steps.js    Steps en stub
```

## Estados de los escenarios

| Color       | Estado  | Qué significa                          |
| ----------- | ------- | -------------------------------------- |
| 🟡 Amarillo | pending | Step definido pero sin implementar     |
| 🔴 Rojo     | failing | Step implementado pero el assert falla |
| 🟢 Verde    | passing | Escenario completo y pasando           |

## Comandos útiles

```bash
# Correr solo autenticación
npx cucumber-js features/auth.feature

# Correr un escenario específico por tag
npx cucumber-js --tags @happy-path

# Output detallado
npx cucumber-js --format progress

# Generar reporte HTML
npx cucumber-js --format html:report.html
```

## Variables de entorno

```bash
TASKFLOW_URL=http://localhost:3000 npx cucumber-js
```

## Entregable

- [ ] Al menos 4 escenarios en tu .feature
- [ ] Steps definidos (pueden ser stubs)
- [ ] Al menos 1 escenario en verde ✅
- [ ] Captura del output de cucumber-js
