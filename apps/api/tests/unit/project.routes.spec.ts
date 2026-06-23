import { beforeEach, describe, expect, it, vi, type MockedObject } from 'vitest'
import request from 'supertest'

const { commentServiceInstance, projectServiceInstance, taskServiceInstance } =
  vi.hoisted(() => ({
    projectServiceInstance: {
      listProjects: vi.fn(),
      createProject: vi.fn(),
      getProject: vi.fn(),
      archiveProject: vi.fn(),
    },
    taskServiceInstance: {
      getTasks: vi.fn(),
    },
    commentServiceInstance: {
      getComments: vi.fn(),
      addComment: vi.fn(),
    },
  }))

vi.mock('../../src/services/project.service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/services/project.service')>()
  return {
    ...actual,
    ProjectService: vi.fn().mockImplementation(() => projectServiceInstance),
  }
})

vi.mock('../../src/services/task.service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/services/task.service')>()
  return {
    ...actual,
    TaskService: vi.fn().mockImplementation(() => taskServiceInstance),
  }
})

vi.mock('../../src/services/comment.service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/services/comment.service')>()
  return {
    ...actual,
    CommentService: vi.fn().mockImplementation(() => commentServiceInstance),
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
import { CommentService } from '../../src/services/comment.service'
import { ProjectService } from '../../src/services/project.service'
import { TaskService } from '../../src/services/task.service'

const app = createApp()
const authHeader = { Authorization: 'Bearer valid-token' }

describe('project routes', () => {
  let projectServiceMock: MockedObject<ProjectService>
  let taskServiceMock: MockedObject<TaskService>
  let commentServiceMock: MockedObject<CommentService>

  beforeEach(() => {
    vi.clearAllMocks()
    projectServiceMock = projectServiceInstance as MockedObject<ProjectService>
    taskServiceMock = taskServiceInstance as MockedObject<TaskService>
    commentServiceMock = commentServiceInstance as MockedObject<CommentService>
  })

  it('returns a health response', async () => {
    const res = await request(app).get('/health')

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ status: 'ok' })
  })

  it('lists projects for the authenticated user', async () => {
    projectServiceMock.listProjects.mockResolvedValue([{ id: 'project-1' }])

    const res = await request(app).get('/api/projects').set(authHeader)

    expect(res.status).toBe(200)
    expect(res.body).toEqual([{ id: 'project-1' }])
    expect(projectServiceMock.listProjects).toHaveBeenCalledWith('user-1')
  })

  it('creates a project', async () => {
    projectServiceMock.createProject.mockResolvedValue({ id: 'project-1' })

    const res = await request(app)
      .post('/api/projects')
      .set(authHeader)
      .send({ name: 'Alpha' })

    expect(res.status).toBe(201)
    expect(projectServiceMock.createProject).toHaveBeenCalledWith('user-1', {
      name: 'Alpha',
    })
  })

  it('returns a single project', async () => {
    projectServiceMock.getProject.mockResolvedValue({ id: 'project-1' })

    const res = await request(app)
      .get('/api/projects/project-1')
      .set(authHeader)

    expect(res.status).toBe(200)
    expect(projectServiceMock.getProject).toHaveBeenCalledWith(
      'project-1',
      'user-1'
    )
  })

  it('archives a project', async () => {
    projectServiceMock.archiveProject.mockResolvedValue({
      id: 'project-1',
      archived: true,
    })

    const res = await request(app)
      .patch('/api/projects/project-1/archive')
      .set(authHeader)

    expect(res.status).toBe(200)
    expect(projectServiceMock.archiveProject).toHaveBeenCalledWith(
      'project-1',
      'user-1'
    )
  })

  it('forwards task filters from query params', async () => {
    taskServiceMock.getTasks.mockResolvedValue([{ id: 'task-1' }])

    const res = await request(app)
      .get('/api/projects/project-1/tasks')
      .query({
        status: 'TODO',
        priority: 'HIGH',
        assignedTo: 'user-2',
        search: 'login',
      })
      .set(authHeader)

    expect(res.status).toBe(200)
    expect(taskServiceMock.getTasks).toHaveBeenCalledWith('project-1', 'user-1', {
      status: 'TODO',
      priority: 'HIGH',
      assignedTo: 'user-2',
      search: 'login',
    })
  })

  it('returns project task comments', async () => {
    commentServiceMock.getComments.mockResolvedValue([{ id: 'comment-1' }])

    const res = await request(app)
      .get('/api/projects/project-1/tasks/task-1/comments')
      .set(authHeader)

    expect(res.status).toBe(200)
    expect(commentServiceMock.getComments).toHaveBeenCalledWith(
      'task-1',
      'user-1'
    )
  })

  it('creates a task comment', async () => {
    commentServiceMock.addComment.mockResolvedValue({ id: 'comment-1' })

    const res = await request(app)
      .post('/api/projects/project-1/tasks/task-1/comments')
      .set(authHeader)
      .send({ body: 'Looks good' })

    expect(res.status).toBe(201)
    expect(commentServiceMock.addComment).toHaveBeenCalledWith(
      'task-1',
      'user-1',
      { body: 'Looks good' }
    )
  })

  it('rejects unauthenticated project access', async () => {
    const res = await request(app).get('/api/projects')

    expect(res.status).toBe(401)
  })
})
