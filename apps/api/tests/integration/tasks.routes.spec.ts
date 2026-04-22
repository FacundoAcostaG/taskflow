import { describe, it, expect, vi, beforeAll, type MockedObject } from 'vitest'
import request from 'supertest'
import { createApp } from '../../src/app'

vi.mock('../../src/services/task.service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/services/task.service')>
    ()
  return {
    ...actual,
    TaskService: vi.fn().mockImplementation(() => ({
      createTask: vi.fn(),
      getTasks: vi.fn(),
    })),
  }
})
vi.mock('../../src/services/auth.service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/services/auth.service')>
    ()
  return {
    ...actual,
    AuthService: vi.fn().mockImplementation(() => ({
      verifyToken: vi.fn().mockReturnValue({ id: 'user-1', email: 'ana@test.com' }),
    })),
  }
})
import { TaskService } from '../../src/services/task.service'
import type { TaskService as TaskServiceType } from '../../src/services/task.service'
const app = createApp()
const VALID_TOKEN = 'Bearer valid.jwt.token'
let taskServiceMock: MockedObject<TaskServiceType>
beforeAll(() => {
  taskServiceMock = (TaskService as ReturnType<typeof vi.fn>).mock.results[0].value

})

describe('POST /projects/:projectId/tasks', () => {
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
      .post('/projects/proj-1/tasks')
      .set('Authorization', VALID_TOKEN)
      .send({ title: 'Implementar Login', priority: 'HIGH' })
    expect(res.status).toBe(201)
    expect(res.body.id).toBeDefined()
    expect(res.body.title).toBe('Implementar Login')
  })

  it('400 — post task con título vacío', async () => {
    const zodLikeError = {
      name: 'ZodError',
      message: JSON.stringify([
        {
          path: ['title'],
          message: 'El título debe contener al menos 3 caracteres',
        },
      ]),
    }
    taskServiceMock.createTask.mockRejectedValue(zodLikeError)

    const res = await request(app)
      .post('/projects/proj-1/tasks')
      .set('Authorization', VALID_TOKEN)
      .send({ title: '', priority: 'HIGH' })

    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Validation error')

  })

  it('401 — post task sin token', async () => {
    taskServiceMock.createTask.mockResolvedValue({
      id: 'task-1',
      title: '',
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
      .post('/projects/proj-1/tasks')
      .set('Authorization', "")
      .send({ title: '', priority: 'HIGH' })
    expect(res.status).toBe(401)
  })

  describe('GET /projects/:projectId/tasks', () => {
    it('200 — devuelve un array de tareas del proyecto', async () => {
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
        {
          id: 'task-2',
          title: 'Agregar tests',
          status: 'IN_PROGRESS',
          priority: 'MEDIUM',
          projectId: 'proj-1',
          assignedTo: null,
          description: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          assignee: null,
        },
        {
          id: 'task-3',
          title: 'Agregar mas tests',
          status: 'IN_PROGRESS',
          priority: 'MEDIUM',
          projectId: 'proj-1',
          assignedTo: null,
          description: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          assignee: null,
        },
      ])

      const res = await request(app)
        .get('/projects/proj-1/tasks')
        .set('Authorization', VALID_TOKEN)

      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
      expect(res.body).toHaveLength(3)
      expect(res.body[0].id).toBe('task-1')
      expect(res.body[0].title).toBe('Implementar Login')
      expect(res.body[1].id).toBe('task-2')
      expect(res.body[1].title).toBe('Agregar tests')
      expect(res.body[2].id).toBe('task-3')
      expect(res.body[2].title).toBe('Agregar mas tests')
    })
    it('401 — Get tasks sin token', async () => {
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
        {
          id: 'task-2',
          title: 'Agregar tests',
          status: 'IN_PROGRESS',
          priority: 'MEDIUM',
          projectId: 'proj-1',
          assignedTo: null,
          description: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          assignee: null,
        },
      ])

      const res = await request(app)
        .get('/projects/proj-1/tasks')
        .set('Authorization', "")

      expect(res.status).toBe(401)
    })
  })
})