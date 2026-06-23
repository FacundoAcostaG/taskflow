import { beforeEach, describe, expect, it, vi, type MockedObject } from 'vitest'
import request from 'supertest'

const { taskServiceInstance } = vi.hoisted(() => ({
  taskServiceInstance: {
    updateTask: vi.fn(),
  },
}))

vi.mock('../../src/services/task.service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/services/task.service')>()
  return {
    ...actual,
    TaskService: vi.fn().mockImplementation(() => taskServiceInstance),
  }
})

vi.mock('../../src/services/auth.service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/services/auth.service')>()
  return {
    ...actual,
    AuthService: vi.fn().mockImplementation(() => ({
      verifyToken: vi.fn().mockReturnValue({ userId: 'user-1' }),
    })),
  }
})

import { createApp } from '../../src/app'
import { TaskService } from '../../src/services/task.service'

const app = createApp()

describe('task routes', () => {
  let taskServiceMock: MockedObject<TaskService>

  beforeEach(() => {
    vi.clearAllMocks()
    taskServiceMock = taskServiceInstance as MockedObject<TaskService>
  })

  it('updates a task', async () => {
    taskServiceMock.updateTask.mockResolvedValue({
      id: 'task-1',
      status: 'DONE',
    })

    const res = await request(app)
      .patch('/api/tasks/task-1')
      .set('Authorization', 'Bearer valid-token')
      .send({ status: 'DONE' })

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ id: 'task-1', status: 'DONE' })
    expect(taskServiceMock.updateTask).toHaveBeenCalledWith(
      'task-1',
      'user-1',
      { status: 'DONE' }
    )
  })

  it('rejects updates without a token', async () => {
    const res = await request(app)
      .patch('/api/tasks/task-1')
      .send({ status: 'DONE' })

    expect(res.status).toBe(401)
  })
})
