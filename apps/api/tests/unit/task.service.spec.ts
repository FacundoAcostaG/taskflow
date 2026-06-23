import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Priority, Status } from '../../src/prisma/enums'
import {
  ForbiddenError,
  NotFoundError,
} from '../../src/services/auth.service'
import { TaskService } from '../../src/services/task.service'

const mockDb = {
  task: {
    create: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    findMany: vi.fn(),
  },
  projectMember: {
    findUnique: vi.fn(),
  },
  statusHistory: {
    create: vi.fn(),
  },
}

const service = new TaskService(mockDb as any)

describe('TaskService extra coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates a task for a valid project member', async () => {
    mockDb.projectMember.findUnique.mockResolvedValue({ userId: 'user-1' })
    mockDb.task.create.mockResolvedValue({ id: 'task-1', title: 'Build API' })

    const result = await service.createTask('project-1', 'user-1', {
      title: 'Build API',
      description: 'Implement endpoints',
      priority: Priority.HIGH,
    })

    expect(result).toEqual({ id: 'task-1', title: 'Build API' })
    expect(mockDb.task.create).toHaveBeenCalledWith({
      data: {
        title: 'Build API',
        description: 'Implement endpoints',
        priority: Priority.HIGH,
        projectId: 'project-1',
        status: 'TODO',
      },
      include: { assignee: { select: { id: true, email: true, name: true } } },
    })
  })

  it('rejects task creation when the user is not a member', async () => {
    mockDb.projectMember.findUnique.mockResolvedValue(null)

    await expect(
      service.createTask('project-1', 'user-1', {
        title: 'Build API',
        priority: Priority.MEDIUM,
      })
    ).rejects.toThrow(ForbiddenError)
  })

  it('rejects updates for missing tasks', async () => {
    mockDb.task.findUnique.mockResolvedValue(null)

    await expect(
      service.updateTask('task-1', 'user-1', { status: Status.DONE })
    ).rejects.toThrow(NotFoundError)
  })

  it('rejects updates for non-members', async () => {
    mockDb.task.findUnique.mockResolvedValue({
      id: 'task-1',
      status: Status.TODO,
      project: { members: [{ userId: 'other-user' }] },
    })

    await expect(
      service.updateTask('task-1', 'user-1', { status: Status.IN_PROGRESS })
    ).rejects.toThrow(ForbiddenError)
  })

  it('lists tasks using the provided filters', async () => {
    mockDb.projectMember.findUnique.mockResolvedValue({ userId: 'user-1' })
    mockDb.task.findMany.mockResolvedValue([{ id: 'task-1' }])

    const result = await service.getTasks('project-1', 'user-1', {
      status: Status.TODO,
      priority: Priority.HIGH,
      assignedTo: 'cm12345678901234567890123',
      search: 'api',
    })

    expect(result).toEqual([{ id: 'task-1' }])
    expect(mockDb.task.findMany).toHaveBeenCalledWith({
      where: {
        projectId: 'project-1',
        status: Status.TODO,
        priority: Priority.HIGH,
        assignedTo: { equals: 'cm12345678901234567890123' },
        OR: [
          { title: { contains: 'api', mode: 'insensitive' } },
          { description: { contains: 'api', mode: 'insensitive' } },
        ],
      },
      include: {
        assignee: { select: { id: true, email: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  })
})
