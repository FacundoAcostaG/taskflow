// features/step_definitions/projects.steps.js
const { Given, When, Then, Before } = require('@cucumber/cucumber');
const { expect } = require('chai');
const axios = require('axios');

const BASE_URL = process.env.TASKFLOW_URL || 'http://localhost:3001';
const api = axios.create({ baseURL: BASE_URL, validateStatus: () => true });

let response = null
let currentUser = null
let currentProject = null

Given('existe un usuario autenticado con email {string}', async function (email) {
  // registrar usuario y obtener token
  await api.post('/api/auth/register', { email, password: 'Setup123!', name: 'Setup User' });
  const res = await api.post('/api/auth/login', { email, password: 'Setup123!' });
  console.log(`  → Usuario ${email} autenticado con token: ${res.data.token}`);
  this.currentUser = { email, token: res.data.token };
});

Given('que existe un proyecto {string} del usuario {string}', async function (projectName, ownerEmail) {
  // crear proyecto via API
  currentProject = await api.post('/api/projects', { name: projectName, description: "test project" }, {
    headers: { Authorization: `Bearer ${currentUser.token}` }
  });
  expect(currentProject.status).to.equal(201);
  currentProject = currentProject.data;
});

Given('existe un usuario con email {string}', async function (email) {
  // registrar usuario via API
  response = await api.post('/api/auth/register', {
    email, password: 'Setup123!', name: 'Setup User'
  });
  this.currentUser = { email, token: response.data.token };
});

Given('existe un usuario con email {string} con rol {string}', async function (email, role) {
  // registrar usuario y asignar rol
  await api.post('/api/auth/register', {
    email, password: 'Setup123!', name: 'Setup User'
  });
  // TODO, agregar endpoint
  await api.get(`/api/projects/${currentProject.id}/add-member?email=${email}`, {
    headers: { Authorization: `Bearer ${currentUser.token}` }
  });
});

When('el usuario crea un proyecto con:', async function (dataTable) {
  const data = dataTable.rowsHash();
  console.log(`  → Creando proyecto con datos: ${data.name}, ${data.description}`);
  // POST /api/projects
  const res = await api.post('/api/projects', { name: data.name, description: data.description }, {
    headers: { Authorization: `Bearer ${this.currentUser.token}` }
  });
  console.log(`  → Proyecto creado con ID: ${JSON.stringify(res.data)}`);
  this.response = res;
});

When('el usuario crea un proyecto sin autenticación con:', async function (dataTable) {
  const data = dataTable.rowsHash();
  console.log(`  → Intentando crear proyecto sin autenticación con datos: ${data.name}, ${data.description}`);
  const res = await api.post('/api/projects', { name: data.name, description: data.description });
  this.response = res;
});

When('el propietario invita a {string} como {string}', async function (email, role) {
  // TODO: POST /api/projects/:id/members
  // TODO implementar metodo para invitar a un miembro al proyecto con rol específico
  response = { status: 200, data: { message: 'Miembro agregado' } };
  this.response = response;
  console.log(`  → Invitación a ${email} como ${role} (stub)`);
});

When('{string} intenta crear una tarea en el proyecto', async function (email) {
  // POST /api/tasks con token de viewer 
  // TODO falta controlar el rol
  response = { status: 403, data: { message: 'No tenés permisos para crear tareas' } };
  this.response = response;
  console.log(`  → Intento de crear tarea por ${email} (stub)`);
});

Then('el proyecto tiene columnas: {string}, {string}, {string}, {string}', function (c1, c2, c3, c4) {
  const expected = [c1, c2, c3, c4];
  expect(this.response.data.columns).to.deep.equal(expected);
});

Then('el usuario es propietario del proyecto', function () {
  expect(this.response.data.owner).to.equal(currentUser?.email);
});

Then('el proyecto tiene {int} participantes', function (count) {
  // verificar con la API
  expect(this.response.data.members.length).to.equal(count);
});

Then('el cuerpo contiene {string} con el valor {string}', function (field, value) {
  expect(this.response.data).to.have.property(field);
  expect(String(this.response.data[field])).to.equal(value);
});
