// features/step_definitions/auth.steps.js
const { Given, When, Then, Before, After } = require('@cucumber/cucumber');
const { expect } = require('chai');
const axios = require('axios');

// ──────────────────────────────────────────────
// CONFIGURACIÓN
// ──────────────────────────────────────────────
const BASE_URL = process.env.TASKFLOW_URL || 'http://localhost:3001';
const api = axios.create({ baseURL: BASE_URL, validateStatus: () => true });

// ──────────────────────────────────────────────
// CONTEXTO COMPARTIDO (world)
// ──────────────────────────────────────────────
// Cucumber.js inyecta "this" como el World object en cada step
// Usamos variables locales al scenario para almacenar estado

let response = null;

// ──────────────────────────────────────────────
// STEPS: GIVEN
// ──────────────────────────────────────────────

Given('el servidor de TaskFlow está disponible', async function () {
  // verificar que el servidor responde (health check)
  console.log('  → Verificando disponibilidad del servidor...');
  const res = await api.get('/health');
  expect(res.status).to.equal(200);
});

Given('la base de datos está limpia', async function () {
  // limpiar datos de test entre escenarios
  const res = await api.post('api/test/reset');
  console.log('  → Limpiando base de datos...', JSON.stringify(res.data));
});

Given('que el email {string} no está registrado', async function (email) {
  // asegurarse de que el email no exista en la BD
  await api.delete('/test/users/' + email);
  console.log(`  → Email ${email} no registrado (pendiente implementar)`);
});

Given('que el email {string} ya está registrado', async function (email) {
  // crear el usuario previamente en la BD
  const res = await api.post('/api/auth/register', {
    email, password: 'Setup123!', name: 'Setup User'
  });
  expect(res.status).to.equal(201);
});

Given('que ningún usuario está registrado', async function () {
  // limpiar todos los usuarios
  await api.post('/test/reset');
});

Given('que existe el usuario con email {string} y password {string}', async function (email, password) {
  // crear usuario con las credenciales dadas
  await api.post('/api/auth/register', { email, password, name: 'Test User' });
});

Given('el usuario no está autenticado', async function () {
  this.currentUser = null;
  console.log('  → Usuario no autenticado (no se enviará token)');
});

// ──────────────────────────────────────────────
// STEPS: WHEN
// ──────────────────────────────────────────────

When('el usuario envía los datos de registro:', async function (dataTable) {
  const data = dataTable.rowsHash();
  this.response = await api.post('/api/auth/register', {email: data.email, password: data.password, name: data.name});
});

When('el usuario envía las credenciales:', async function (dataTable) {
  const data = dataTable.rowsHash();

  // descomentar cuando el servidor esté corriendo
  this.response = await api.post('/api/auth/login', {
    email: data.email,
    password: data.password
  });
});