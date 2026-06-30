import { beforeEach, describe, expect, it, vi } from 'vitest'
import request from 'supertest'

const { authServiceInstance, taskServiceInstance } = vi.hoisted(() => ({
  authServiceInstance: {
    verifyToken: vi.fn(),
  },
  taskServiceInstance: {
    updateTask: vi.fn(),
  },
}))

vi.mock('../../src/services/auth.service', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('../../src/services/auth.service')>()
  return {
    ...actual,
    AuthService: vi.fn().mockImplementation(() => authServiceInstance),
  }
})

vi.mock('../../src/services/task.service', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('../../src/services/task.service')>()
  return {
    ...actual,
    TaskService: vi.fn().mockImplementation(() => taskServiceInstance),
  }
})

import { createApp } from '../../src/app'
import {
  NotFoundError,
  UnprocessableError,
} from '../../src/services/auth.service'

const app = createApp()
const authHeader = { Authorization: 'Bearer valid-token' }

// US-06:
// esta suite valida el endpoint de cambio de estado de tareas.
describe('PATCH /api/tasks/:taskId — US-06', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authServiceInstance.verifyToken.mockReturnValue({ userId: 'user-1' })
  })

  // US-06 happy path: permite actualizar el estado y devuelve la tarea resultante.
  it('actualiza el estado de una tarea con 200 (@US-06)', async () => {
    taskServiceInstance.updateTask.mockResolvedValue({
      id: 'task-1',
      title: 'Implementar login',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
    })

    const res = await request(app)
      .patch('/api/tasks/task-1')
      .set(authHeader)
      .send({ status: 'IN_PROGRESS' })

    expect(res.status).toBe(200)
    expect(res.body.status).toBe('IN_PROGRESS')
    expect(taskServiceInstance.updateTask).toHaveBeenCalledWith(
      'task-1',
      'user-1',
      { status: 'IN_PROGRESS' }
    )
  })

  // US-06 error: rechaza transiciones fuera de la máquina de estados.
  it('rechaza transición inválida con 422 (@US-06)', async () => {
    taskServiceInstance.updateTask.mockRejectedValueOnce(
      new UnprocessableError('Invalid transition: TODO -> DONE')
    )

    const res = await request(app)
      .patch('/api/tasks/task-1')
      .set(authHeader)
      .send({ status: 'DONE' })

    expect(res.status).toBe(422)
    expect(res.body.error).toMatch(/invalid transition/i)
  })

  // US-06 error: responde 404 cuando la tarea no existe.
  it('rechaza tarea inexistente con 404 (@US-06)', async () => {
    taskServiceInstance.updateTask.mockRejectedValueOnce(
      new NotFoundError('Task not found')
    )

    const res = await request(app)
      .patch('/api/tasks/task-1')
      .set(authHeader)
      .send({ status: 'IN_PROGRESS' })

    expect(res.status).toBe(404)
    expect(res.body.error).toMatch(/task not found/i)
  })

  // US-06 error: cambiar estado requiere autenticación.
  it('rechaza petición sin token con 401 (@US-06)', async () => {
    const res = await request(app)
      .patch('/api/tasks/task-1')
      .send({ status: 'IN_PROGRESS' })

    expect(res.status).toBe(401)
  })
})
