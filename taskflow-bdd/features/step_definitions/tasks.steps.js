// features/step_definitions/tasks.steps.js
const { Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('chai');
const axios = require('axios');

const BASE_URL = process.env.TASKFLOW_URL || 'http://localhost:3001';
const api = axios.create({ baseURL: BASE_URL, validateStatus: () => true });

let response = null;
let currentTask = null;
let currentProject = null;
let currentUser = null;

Given('existe un proyecto {string} con un miembro autenticado', async function (projectName) {
  const res = await api.post('/api/auth/register', { email: 'user@example.com', password: 'Password123!', name: 'Test User' });
  const token = res.data.token;
  this.currentUser = { email: 'user@example.com', token };
  this.currentProject = await api.post('/api/projects', { name: projectName, description: "test project" }, {
    headers: { Authorization: `Bearer ${token}` }
  });
});

Given('que existe la tarea {string} en la columna TODO', async function (taskTitle) {
  // crear tarea via API
  const res = await api.post('/api/projects/' + this.currentProject.data.id + '/tasks', { title: taskTitle }, {
    headers: { Authorization: `Bearer ${this.currentUser.token}` }
  });
  this.currentTask = res.data;
  console.log(`  → Tarea creada con ID: ${JSON.stringify(res.data)}`);
});

Given('existe el miembro {string} en el proyecto', async function (email) {
  // TODO: verificar existencia del miembro
  const res = await api.get(`/api/projects/${this.currentProject.data.id}/members`, {
    headers: { Authorization: `Bearer ${this.currentUser.token}` }
  });
});

When('el miembro crea una tarea con:', async function (dataTable) {
  const data = dataTable.rowsHash();
  // POST /api/tasks
  console.log(`  → Creando tarea con datos: ${data.title}, ${data.priority}, this.currentProject.id: ${this.currentProject.data.id}`);
  const res = await api.post('/api/projects/' + this.currentProject.data.id + '/tasks', { title: data.title, priority: data.priority}, {
    headers: { Authorization: `Bearer ${this.currentUser.token}` }
  });
  this.response = res;
});

When('el miembro mueve la tarea a la columna {string}', async function (column) {
  // PATCH /api/tasks/:id
  console.log(`  → Moviendo tarea ${this.currentTask.id} a la columna ${column}`);
  const res = await api.patch(`/api/tasks/${this.currentTask.id}`, { column }, {
    headers: { Authorization: `Bearer ${this.currentUser.token}` }
  });
  this.response = res;
});

When('el miembro asigna la tarea a {string}', async function (email) {
  // TODO: PATCH /api/tasks/:id/assign
  const res = await api.patch(`/api/tasks/${this.currentTask.id}/assign`, { email }, {
    headers: { Authorization: `Bearer ${this.currentUser.token}` }
  });
  this.response = res;
  console.log(`  → Tarea asignada a ${email} (stub)`);
});

Then('la tarea aparece en la columna {string}', function (column) {
  expect(this.response.data.column).to.equal(column);
});

Then('la tarea tiene prioridad {string}', function (priority) {
  expect(this.response.data.priority).to.equal(priority);
});

Then('el estado de la tarea es {string}', function (status) {
  expect(this.response.data.status).to.equal(status);
});

Then('la tarea está asignada a {string}', function (email) {
  expect(this.response.data.assignee).to.equal(email);
});

Then('la tarea tiene estado {string}', function (status) {
  expect(this.response.data.status).to.equal(status);
});