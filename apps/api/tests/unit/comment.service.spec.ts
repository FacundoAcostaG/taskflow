import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  ForbiddenError,
  NotFoundError,
} from '../../src/services/auth.service'
import { CommentService } from '../../src/services/comment.service'

const mockDb = {
  task: {
    findUnique: vi.fn(),
  },
  comment: {
    create: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    delete: vi.fn(),
  },
}

const service = new CommentService(mockDb as any)

const taskForMember = {
  id: 'task-1',
  project: {
    members: [{ userId: 'user-1' }],
  },
}

describe('CommentService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates a comment for a project member', async () => {
    mockDb.task.findUnique.mockResolvedValue(taskForMember)
    mockDb.comment.create.mockResolvedValue({ id: 'comment-1', body: 'Nice' })

    const result = await service.addComment('task-1', 'user-1', {
      body: 'Nice',
    })

    expect(result).toEqual({ id: 'comment-1', body: 'Nice' })
    expect(mockDb.comment.create).toHaveBeenCalledWith({
      data: { body: 'Nice', taskId: 'task-1', authorId: 'user-1' },
      include: { author: { select: { id: true, email: true, name: true } } },
    })
  })

  it('rejects comment creation for missing tasks', async () => {
    mockDb.task.findUnique.mockResolvedValue(null)

    await expect(
      service.addComment('task-1', 'user-1', { body: 'Nice' })
    ).rejects.toThrow(NotFoundError)
  })

  it('rejects comment creation for non-members', async () => {
    mockDb.task.findUnique.mockResolvedValue({
      project: { members: [{ userId: 'other-user' }] },
    })

    await expect(
      service.addComment('task-1', 'user-1', { body: 'Nice' })
    ).rejects.toThrow(ForbiddenError)
  })

  it('lists comments for a project member using the configured ordering', async () => {
    mockDb.task.findUnique.mockResolvedValue(taskForMember)
    mockDb.comment.findMany.mockResolvedValue([{ id: 'comment-1' }])

    const result = await service.getComments('task-1', 'user-1')

    expect(result).toEqual([{ id: 'comment-1' }])
    expect(mockDb.comment.findMany).toHaveBeenCalledWith({
      where: { taskId: 'task-1' },
      include: { author: { select: { id: true, email: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    })
  })

  it('rejects listing comments for non-members', async () => {
    mockDb.task.findUnique.mockResolvedValue({
      project: { members: [{ userId: 'other-user' }] },
    })

    await expect(service.getComments('task-1', 'user-1')).rejects.toThrow(
      ForbiddenError
    )
  })

  it('rejects deleting a missing comment', async () => {
    mockDb.comment.findUnique.mockResolvedValue(null)

    await expect(service.deleteComment('comment-1', 'user-1')).rejects.toThrow(
      NotFoundError
    )
  })

  it('rejects deleting someone else comment', async () => {
    mockDb.comment.findUnique.mockResolvedValue({
      id: 'comment-1',
      authorId: 'other-user',
    })

    await expect(service.deleteComment('comment-1', 'user-1')).rejects.toThrow(
      ForbiddenError
    )
  })

  it('deletes an own comment', async () => {
    mockDb.comment.findUnique.mockResolvedValue({
      id: 'comment-1',
      authorId: 'user-1',
    })

    await service.deleteComment('comment-1', 'user-1')

    expect(mockDb.comment.delete).toHaveBeenCalledWith({
      where: { id: 'comment-1' },
    })
  })
})
