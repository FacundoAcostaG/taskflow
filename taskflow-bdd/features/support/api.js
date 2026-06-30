const assert = require('node:assert/strict')

const BASE_URL = process.env.TASKFLOW_URL || 'http://localhost:3001'

function buildUrl(path) {
  return new URL(path, BASE_URL).toString()
}

async function request(path, options = {}) {
  const headers = { ...(options.headers || {}) }
  const hasJsonBody = options.body !== undefined

  if (hasJsonBody) {
    headers['content-type'] = 'application/json'
  }

  const response = await fetch(buildUrl(path), {
    method: options.method || 'GET',
    headers,
    body: hasJsonBody ? JSON.stringify(options.body) : undefined,
  })

  const rawBody = await response.text()
  let data = rawBody

  if (rawBody) {
    try {
      data = JSON.parse(rawBody)
    } catch {
      data = rawBody
    }
  } else {
    data = null
  }

  return {
    status: response.status,
    data,
  }
}

function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function registerUser(email, overrides = {}) {
  return request('/api/auth/register', {
    method: 'POST',
    body: {
      email,
      password: overrides.password || 'Setup123!',
      name: overrides.name || 'Setup User',
    },
  })
}

async function loginUser(email, password = 'Setup123!') {
  return request('/api/auth/login', {
    method: 'POST',
    body: { email, password },
  })
}

async function createAuthenticatedUser(email, overrides = {}) {
  const password = overrides.password || 'Setup123!'
  const registerResponse = await registerUser(email, {
    password,
    name: overrides.name,
  })

  assert.equal(
    registerResponse.status,
    201,
    `No se pudo registrar el usuario de setup ${email}`
  )

  const loginResponse = await loginUser(email, password)

  assert.equal(
    loginResponse.status,
    200,
    `No se pudo autenticar el usuario de setup ${email}`
  )

  return {
    email,
    password,
    token: loginResponse.data.token,
    user: loginResponse.data.user,
  }
}

async function createProject(token, data) {
  return request('/api/projects', {
    method: 'POST',
    headers: authHeaders(token),
    body: data,
  })
}

async function createTask(projectId, token, data) {
  return request(`/api/projects/${projectId}/tasks`, {
    method: 'POST',
    headers: authHeaders(token),
    body: data,
  })
}

async function updateTask(taskId, token, data) {
  return request(`/api/tasks/${taskId}`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: data,
  })
}

async function resetData() {
  return request('/api/test/reset', { method: 'POST' })
}

module.exports = {
  BASE_URL,
  assert,
  authHeaders,
  createAuthenticatedUser,
  createProject,
  createTask,
  loginUser,
  registerUser,
  request,
  resetData,
  updateTask,
}
