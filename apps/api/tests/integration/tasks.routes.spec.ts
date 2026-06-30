import { beforeEach, describe, expect, it, vi, type MockedObject } from 'vitest'
import request from 'supertest'
import { ZodError, ZodIssueCode } from 'zod'
import { createApp } from '../../src/app'

const { authServiceInstance, taskServiceInstance } = vi.hoisted(() => ({
  authServiceInstance: {
    verifyToken: vi.fn(),
  },
  taskServiceInstance: {
    createTask: vi.fn(),
    getTasks: vi.fn(),
  },
}))

vi.mock('../../src/services/task.service', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('../../src/services/task.service')>()
  return {
    ...actual,
    TaskService: vi.fn().mockImplementation(() => taskServiceInstance),
  }
})

vi.mock('../../src/services/auth.service', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('../../src/services/auth.service')>()
  return {
    ...actual,
    AuthService: vi.fn().mockImplementation(() => authServiceInstance),
  }
})

import { ForbiddenError } from '../../src/services/auth.service'
import type { TaskService } from '../../src/services/task.service'

const app = createApp()
const authHeader = { Authorization: 'Bearer valid-token' }

// US-05 y US-07:
// esta suite valida el contrato HTTP de las rutas de tareas con servicios mockeados.
describe('Task routes integration', () => {
  let taskServiceMock: MockedObject<TaskService>

  beforeEach(() => {
    vi.clearAllMocks()
    authServiceInstance.verifyToken.mockReturnValue({ userId: 'user-1' })
    taskServiceMock = taskServiceInstance as MockedObject<TaskService>
  })

  describe('POST /api/projects/:projectId/tasks — US-05', () => {
    // US-05 happy path: la ruta crea una tarea y devuelve 201.
    it('201 — crea tarea y devuelve el objeto creado', async () => {
      taskServiceMock.createTask.mockResolvedValue({
        id: 'task-1',
        title: 'Implementar Login',
        status: 'TODO',
        priority: 'HIGH',
        projectId: 'proj-1',
        assignedTo: null,
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        assignee: null,
      })

      const res = await request(app)
        .post('/api/projects/proj-1/tasks')
        .set(authHeader)
        .send({ title: 'Implementar Login', priority: 'HIGH' })

      expect(res.status).toBe(201)
      expect(res.body.id).toBeDefined()
      expect(res.body.title).toBe('Implementar Login')
    })

    // US-05 error: la ruta convierte una validación fallida en 400.
    it('400 — título vacío', async () => {
      taskServiceMock.createTask.mockRejectedValueOnce(
        new ZodError([
          {
            code: ZodIssueCode.too_small,
            path: ['title'],
            message: 'String must contain at least 3 character(s)',
            minimum: 3,
            type: 'string',
            inclusive: true,
          },
        ])
      )

      const res = await request(app)
        .post('/api/projects/proj-1/tasks')
        .set(authHeader)
        .send({ title: '', priority: 'HIGH' })

      expect(res.status).toBe(400)
      expect(res.body.error).toBeDefined()
    })

    // US-05 error: no permite crear tareas sin token.
    it('401 — post task sin token', async () => {
      const res = await request(app)
        .post('/api/projects/proj-1/tasks')
        .send({ title: 'Implementar Login', priority: 'HIGH' })

      expect(res.status).toBe(401)
    })
  })

  describe('GET /api/projects/:projectId/tasks — US-07', () => {
    // US-07 happy path: reenvía correctamente filtros de listado y búsqueda.
    it('200 — devuelve tareas aplicando filtros (@US-07)', async () => {
      taskServiceMock.getTasks.mockResolvedValue([
        {
          id: 'task-1',
          title: 'Implementar Login',
          status: 'TODO',
          priority: 'HIGH',
          projectId: 'proj-1',
          assignedTo: null,
          description: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          assignee: null,
        },
      ])

      const res = await request(app)
        .get('/api/projects/proj-1/tasks')
        .query({
          status: 'TODO',
          priority: 'HIGH',
          assignedTo: 'user-2',
          search: 'login',
        })
        .set(authHeader)

      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
      expect(taskServiceMock.getTasks).toHaveBeenCalledWith(
        'proj-1',
        'user-1',
        {
          status: 'TODO',
          priority: 'HIGH',
          assignedTo: 'user-2',
          search: 'login',
        }
      )
    })

    // US-07 error: un usuario ajeno al proyecto no puede listar tareas.
    it('403 — rechaza listar tareas de un proyecto ajeno (@US-07)', async () => {
      taskServiceMock.getTasks.mockRejectedValueOnce(
        new ForbiddenError('Not a project member')
      )

      const res = await request(app)
        .get('/api/projects/proj-1/tasks')
        .set(authHeader)

      expect(res.status).toBe(403)
      expect(res.body.error).toMatch(/not a project member/i)
    })

    // US-07 error: el listado requiere autenticación.
    it('401 — rechaza listar tareas sin token (@US-07)', async () => {
      const res = await request(app).get('/api/projects/proj-1/tasks')

      expect(res.status).toBe(401)
    })
  })
})
