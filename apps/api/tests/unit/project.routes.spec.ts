import { beforeEach, describe, expect, it, vi, type MockedObject } from 'vitest'
import request from 'supertest'
import { Priority, Status } from '../../src/prisma/enums'

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
const now = new Date('2026-06-23T00:00:00.000Z')

type ListProjectsResult = Awaited<ReturnType<ProjectService['listProjects']>>
type GetProjectResult = Awaited<ReturnType<ProjectService['getProject']>>
type CreateProjectResult = Awaited<ReturnType<ProjectService['createProject']>>
type ArchiveProjectResult = Awaited<ReturnType<ProjectService['archiveProject']>>
type GetTasksResult = Awaited<ReturnType<TaskService['getTasks']>>
type GetCommentsResult = Awaited<ReturnType<CommentService['getComments']>>
type AddCommentResult = Awaited<ReturnType<CommentService['addComment']>>

const projectListItem: ListProjectsResult[number] = {
  id: 'project-1',
  name: 'Alpha',
  description: 'Main project',
  archived: false,
  ownerId: 'user-1',
  createdAt: now,
  updatedAt: now,
  owner: {
    id: 'user-1',
    email: 'ana@test.com',
    name: 'Ana',
  },
  _count: {
    tasks: 3,
    members: 2,
  },
}

const createdProject: CreateProjectResult = {
  id: 'project-1',
  name: 'Alpha',
  description: 'Main project',
  archived: false,
  ownerId: 'user-1',
  createdAt: now,
  updatedAt: now,
}

const projectDetail: GetProjectResult = {
  id: 'project-1',
  name: 'Alpha',
  description: 'Main project',
  archived: false,
  ownerId: 'user-1',
  createdAt: now,
  updatedAt: now,
  owner: {
    id: 'user-1',
    email: 'ana@test.com',
    name: 'Ana',
  },
  members: [
    {
      id: 'member-1',
      projectId: 'project-1',
      userId: 'user-1',
      role: 'OWNER',
      createdAt: now,
      user: {
        id: 'user-1',
        email: 'ana@test.com',
        name: 'Ana',
      },
    },
  ],
  _count: {
    tasks: 3,
  },
}

const archivedProject: ArchiveProjectResult = {
  ...createdProject,
  archived: true,
}

const taskListItem: GetTasksResult[number] = {
  id: 'task-1',
  title: 'Implement login',
  description: 'Build auth UI',
  status: Status.TODO,
  priority: Priority.HIGH,
  projectId: 'project-1',
  assignedTo: null,
  createdAt: now,
  updatedAt: now,
  assignee: null,
}

const commentListItem: GetCommentsResult[number] = {
  id: 'comment-1',
  body: 'Looks good',
  taskId: 'task-1',
  authorId: 'user-1',
  createdAt: now,
  author: {
    id: 'user-1',
    email: 'ana@test.com',
    name: 'Ana',
  },
}

const createdComment: AddCommentResult = commentListItem

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
    projectServiceMock.listProjects.mockResolvedValue([projectListItem])

    const res = await request(app).get('/api/projects').set(authHeader)

    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
    expect(res.body[0].id).toBe('project-1')
    expect(projectServiceMock.listProjects).toHaveBeenCalledWith('user-1')
  })

  it('creates a project', async () => {
    projectServiceMock.createProject.mockResolvedValue(createdProject)

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
    projectServiceMock.getProject.mockResolvedValue(projectDetail)

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
    projectServiceMock.archiveProject.mockResolvedValue(archivedProject)

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
    taskServiceMock.getTasks.mockResolvedValue([taskListItem])

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
    commentServiceMock.getComments.mockResolvedValue([commentListItem])

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
    commentServiceMock.addComment.mockResolvedValue(createdComment)

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
