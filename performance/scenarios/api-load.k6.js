// performance/scenarios/api-load.k6.js
import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate, Trend } from 'k6/metrics'

// ── Custom metrics ────────────────────────────────────────────
const errorRate = new Rate('error_rate')
const listDuration = new Trend('list_duration', true)
const tasksDuration = new Trend('tasks_duration', true)
const createTaskDuration = new Trend('create_task_duration', true)

// ── Thresholds (SLOs definidos en US como NFRs) ───────────────
export const options = {
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    'http_req_duration{scenario:load,endpoint:create_project_task}': [
      'p(95)<500',
    ],
    error_rate: ['rate<0.01'],
    list_duration: ['p(95)<400'],
    create_task_duration: ['p(95)<400'],
    tasks_duration: ['p(95)<400'],
  },

  scenarios: {
    // Carga normal: 50 usuarios concurrentes durante 2 minutos
    load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 50 }, // ramp up
        { duration: '1m', target: 50 }, // steady state
        { duration: '30s', target: 0 }, // ramp down
      ],
      tags: { scenario: 'load' },
    },

    // Pico: spike de 200 usuarios
    /*     spike: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 200 }, // spike súbito
        { duration: '30s', target: 200 }, // mantener
        { duration: '10s', target: 0 },   // bajar
      ],
      startTime: '3m', // empieza después del load test
      tags: { scenario: 'spike' },
    }, */
  },
}

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001'

export function setup() {
  const timestamp = Date.now()
  const email = `perf-${timestamp}@test.com`
  const password = 'Password1'
  const name = 'Perf User'

  // TODO 1: Registrar usuario con email dinamico
  const regRes = http.post(
    `${BASE_URL}/api/auth/register`,
    JSON.stringify({
      email,
      password,
      name,
    }),
    { headers: { 'Content-Type': 'application/json' } }
  )

  const token = regRes.json('token')

  // TODO 2: Crear un proyecto para ese usuario
  const projectRes = http.post(
    `${BASE_URL}/api/projects`,
    JSON.stringify({
      name: 'Test Project',
      description: 'Project for performance testing',
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    }
  )

  const projectId = projectRes.json('id')

  // TODO 3: Crear una tarea inicial dentro del proyecto
  http.post(
    `${BASE_URL}/api/projects/${projectId}/tasks`,
    JSON.stringify({
      title: 'Initial Test Task',
      priority: 'HIGH',
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    }
  )

  // TODO 4: Retornar los datos que necesita el VU
  return { token, projectId }
}

export default function (data) {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${data.token}`,
  }

  // 1. Listar proyectos
  const listRes = http.get(`${BASE_URL}/api/projects`, { headers })
  listDuration.add(listRes.timings.duration)
  errorRate.add(listRes.status !== 200)
  check(listRes, { 'projects status 200': (r) => r.status === 200 })

  sleep(0.5)

  // 2. Crear una tarea (Métrica Hito 6)
  const postTaskRes = http.post(
    `${BASE_URL}/api/projects/${data.projectId}/tasks`,
    JSON.stringify({
      title: `Load Task ${Date.now()}`,
      priority: 'MEDIUM',
    }),
    {
      headers,
      tags: { endpoint: 'create_project_task' },
    }
  )
  createTaskDuration.add(postTaskRes.timings.duration)
  errorRate.add(postTaskRes.status !== 201)
  check(postTaskRes, { 'create task status 201': (r) => r.status === 201 })

  sleep(0.5)

  // 3. Listar tareas
  const tasksRes = http.get(
    `${BASE_URL}/api/projects/${data.projectId}/tasks?status=TODO`,
    { headers }
  )
  tasksDuration.add(tasksRes.timings.duration)
  errorRate.add(tasksRes.status !== 200)
  check(tasksRes, { 'tasks status 200': (r) => r.status === 200 })

  sleep(1)
}
