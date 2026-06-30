import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '../../src/services/auth.service'
import { ProjectService } from '../../src/services/project.service'

const mockDb = {
  project: {
    findFirst: vi.fn(),
    create: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
}

const service = new ProjectService(mockDb as any)

describe('ProjectService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates a project and enrolls the owner as member', async () => {
    mockDb.project.findFirst.mockResolvedValue(null)
    mockDb.project.create.mockResolvedValue({ id: 'project-1', name: 'Alpha' })

    const result = await service.createProject('user-1', {
      name: 'Alpha',
      description: 'Main project',
    })

    expect(result).toEqual({ id: 'project-1', name: 'Alpha' })
    expect(mockDb.project.create).toHaveBeenCalledWith({
      data: {
        name: 'Alpha',
        description: 'Main project',
        ownerId: 'user-1',
        members: {
          create: { userId: 'user-1', role: 'OWNER' },
        },
      },
    })
  })

  it('rejects duplicate active project names for the same owner', async () => {
    mockDb.project.findFirst.mockResolvedValue({ id: 'existing-project' })

    await expect(
      service.createProject('user-1', { name: 'Alpha' })
    ).rejects.toThrow(ConflictError)
  })

  it('lists only active projects for a member ordered by creation date', async () => {
    mockDb.project.findMany.mockResolvedValue([{ id: 'project-1' }])

    const result = await service.listProjects('user-2')

    expect(result).toEqual([{ id: 'project-1' }])
    expect(mockDb.project.findMany).toHaveBeenCalledWith({
      where: {
        members: { some: { userId: 'user-2' } },
        archived: false,
      },
      include: {
        owner: { select: { id: true, email: true, name: true } },
        _count: { select: { tasks: true, members: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  })

  it('throws when getting a missing project', async () => {
    mockDb.project.findUnique.mockResolvedValue(null)

    await expect(service.getProject('project-1', 'user-1')).rejects.toThrow(
      NotFoundError
    )
  })

  it('throws when a non-member tries to read a project', async () => {
    mockDb.project.findUnique.mockResolvedValue({
      id: 'project-1',
      members: [{ userId: 'someone-else' }],
    })

    await expect(service.getProject('project-1', 'user-1')).rejects.toThrow(
      ForbiddenError
    )
  })

  it('returns the project when the requester is a member', async () => {
    mockDb.project.findUnique.mockResolvedValue({
      id: 'project-1',
      members: [{ userId: 'user-1' }],
    })

    const result = await service.getProject('project-1', 'user-1')

    expect(result).toEqual({
      id: 'project-1',
      members: [{ userId: 'user-1' }],
    })
  })

  it('throws when archiving a missing project', async () => {
    mockDb.project.findUnique.mockResolvedValue(null)

    await expect(service.archiveProject('project-1', 'user-1')).rejects.toThrow(
      NotFoundError
    )
  })

  it('throws when a non-owner tries to archive a project', async () => {
    mockDb.project.findUnique.mockResolvedValue({
      id: 'project-1',
      ownerId: 'other-user',
    })

    await expect(service.archiveProject('project-1', 'user-1')).rejects.toThrow(
      ForbiddenError
    )
  })

  it('archives a project for its owner', async () => {
    mockDb.project.findUnique.mockResolvedValue({
      id: 'project-1',
      ownerId: 'user-1',
    })
    mockDb.project.update.mockResolvedValue({ id: 'project-1', archived: true })

    const result = await service.archiveProject('project-1', 'user-1')

    expect(result).toEqual({ id: 'project-1', archived: true })
    expect(mockDb.project.update).toHaveBeenCalledWith({
      where: { id: 'project-1' },
      data: { archived: true },
    })
  })
})
