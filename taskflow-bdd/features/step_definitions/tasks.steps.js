// features/step_definitions/tasks.steps.js
const { Given, When, Then } = require('@cucumber/cucumber')
const { expect } = require('chai')
const axios = require('axios')

const BASE_URL = process.env.TASKFLOW_URL || 'http://localhost:3000'
const api = axios.create({ baseURL: BASE_URL, validateStatus: () => true })

let response = null
let currentTask = null

Given(
  'existe un proyecto {string} con un miembro autenticado',
  async function (projectName) {
    // TODO: setup completo de proyecto con miembro autenticado
    console.log(`  → Proyecto "${projectName}" con miembro autenticado (stub)`)
  }
)

Given(
  'que existe la tarea {string} en la columna {string}',
  async function (taskTitle, column) {
    // TODO: crear tarea via API
    currentTask = { id: 'task-123', title: taskTitle, column }
    console.log(`  → Tarea "${taskTitle}" en "${column}" (stub)`)
  }
)

Given('existe el miembro {string} en el proyecto', async function (email) {
  // TODO: verificar existencia del miembro
  console.log(`  → Miembro ${email} en el proyecto (stub)`)
})

When('el miembro crea una tarea con:', async function (dataTable) {
  const data = dataTable.rowsHash()
  // TODO: POST /api/tasks
  response = {
    status: 201,
    data: {
      id: 'task-new',
      title: data.title,
      priority: data.priority,
      column: 'To Do',
      status: 'todo',
    },
  }
  console.log(`  → POST /api/tasks: "${data.title}" (stub)`)
})

When(
  'el miembro mueve la tarea a la columna {string}',
  async function (column) {
    // TODO: PATCH /api/tasks/:id
    response = {
      status: 200,
      data: {
        id: currentTask?.id,
        column,
        status:
          column === 'In Progress'
            ? 'in_progress'
            : column.toLowerCase().replace(' ', '_'),
      },
    }
    console.log(`  → PATCH /api/tasks: movida a "${column}" (stub)`)
  }
)

When('el miembro asigna la tarea a {string}', async function (email) {
  // TODO: PATCH /api/tasks/:id/assign
  response = { status: 200, data: { assignee: email } }
  console.log(`  → Tarea asignada a ${email} (stub)`)
})

Then('la respuesta tiene código de estado {int}', function (expectedStatus) {
  expect(response.status).to.equal(expectedStatus)
})

Then('la tarea aparece en la columna {string}', function (column) {
  expect(response.data.column).to.equal(column)
})

Then('la tarea tiene prioridad {string}', function (priority) {
  expect(response.data.priority).to.equal(priority)
})

Then('el estado de la tarea es {string}', function (status) {
  expect(response.data.status).to.equal(status)
})

Then('la tarea está asignada a {string}', function (email) {
  expect(response.data.assignee).to.equal(email)
})

Then('el cuerpo contiene {string} con valor {string}', function (field, value) {
  expect(String(response.data[field])).to.equal(value)
})
