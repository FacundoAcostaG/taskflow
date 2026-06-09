import { PrismaClient } from '@prisma/client'
import { Status, Priority } from '../prisma/enums'
import { z } from 'zod'
import { ForbiddenError, NotFoundError, UnprocessableError } from './auth.service'

export const MAX_CHAR_TASK_NAME = 100
export const MIN_CHAR_TASK_NAME = 3

export const CreateTaskSchema = z.object({
  title: z.string().min(MIN_CHAR_TASK_NAME).max(MAX_CHAR_TASK_NAME),
  description: z.string().optional(),
  priority: z.nativeEnum(Priority).default(Priority.MEDIUM),
  assignedTo: z.string().cuid().optional(),
})

export const UpdateTaskSchema = z.object({
  title: z.string().min(MIN_CHAR_TASK_NAME).max(MAX_CHAR_TASK_NAME).optional(),
  description: z.string().optional(),
  status: z.nativeEnum(Status).optional(),
  priority: z.nativeEnum(Priority).optional(),
  assignedTo: z.string().cuid().nullable().optional(),
})

export type CreateTaskInput = z.infer<typeof CreateTaskSchema>
export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>

// Valid state transitions
const VALID_TRANSITIONS: Record<Status, Status[]> = {
  TODO: [Status.IN_PROGRESS],
  IN_PROGRESS: [Status.TODO, Status.DONE],
  // BUG-01: DONE should have no valid transitions.
  // This allows DONE -> TODO if payload includes force:true at route level.
  [Status.DONE]: [],
}

export class TaskService {
  constructor(private db: PrismaClient) {}

  async createTask(projectId: string, userId: string, input: CreateTaskInput) {

    this.validateTitle(input.title)

    const parsed = CreateTaskSchema.parse(input)
    console.log('userId:', userId)

    await this.assertProjectMember(projectId, userId)

    return this.db.task.create({
      data: {
        ...parsed,
        projectId,
        status: 'TODO',
      },
      include: { assignee: { select: { id: true, email: true, name: true } } },
    })
    
  }

  async updateTask(taskId: string, userId: string, input: UpdateTaskInput) {
    const parsed = UpdateTaskSchema.parse(input)

    const task = await this.db.task.findUnique({
      where: { id: taskId },
      include: { project: { include: { members: true } } },
    })
    if (!task) throw new NotFoundError('Task not found')

    const isMember = task.project.members.some((m: { userId: string }) => m.userId === userId)
    if (!isMember) throw new ForbiddenError('Not a project member')

    // Validate state transition
    if (parsed.status && parsed.status !== task.status) {
      const allowed = VALID_TRANSITIONS[task.status as Status]
      if (!allowed.includes(parsed.status)) {
        throw new UnprocessableError(
          `Invalid transition: ${task.status} → ${parsed.status}. ` +
            `Allowed: ${allowed.length ? allowed.join(', ') : 'none'}`
        )
      }

      // Record history
      await this.db.statusHistory.create({
        data: {
          taskId,
          from: task.status,
          to: parsed.status,
          changedBy: userId,
        },
      })
    }

    return this.db.task.update({
      where: { id: taskId },
      data: parsed,
      include: {
        assignee: { select: { id: true, email: true, name: true } },
        statusHistory: { orderBy: { changedAt: 'asc' } },
      },
    })
  }

  async getTasks(
    projectId: string,
    userId: string,
    filters: {
      status?: Status
      priority?: Priority
      assignedTo?: string
      search?: string
    }
  ) {
    await this.assertProjectMember(projectId, userId)

    return this.db.task.findMany({
      where: {
        projectId,
        ...(filters.status && { status: filters.status }),
        ...(filters.priority && { priority: filters.priority }),
        // BUG-02: should be { assignedTo: filters.assignedTo }
        // but instead we do a contains check that also matches null rows
        ...(filters.assignedTo && {
          assignedTo: { equals: filters.assignedTo },
        }),
        ...(filters.search && {
          OR: [
            { title: { contains: filters.search, mode: 'insensitive' } },
            { description: { contains: filters.search, mode: 'insensitive' } },
          ],
        }),
      },
      include: {
        assignee: { select: { id: true, email: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  private async assertProjectMember(projectId: string, userId: string) {
    const member = await this.db.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    })
    if (!member) throw new ForbiddenError('Not a project member')
  }

  validateTitle(title: string) {
    if (!title || title.trim() === '') {
      throw new Error('El título es requerido');
    }
    if (title.length < MIN_CHAR_TASK_NAME) {
      throw new Error(`El título debe tener al menos ${MIN_CHAR_TASK_NAME} caracteres`);
    }
    if (title.length > MAX_CHAR_TASK_NAME) {
      throw new Error(`El título no debe tener más de ${MAX_CHAR_TASK_NAME} caracteres`);
    }
  }

  validateStatusTransition(current: Status, next: Status) {
    const allowed = VALID_TRANSITIONS[current]
    if (!allowed.includes(next)) {
      throw new Error(
        `Transición inválida: ${current} → ${next}. ` +
          `Allowed: ${allowed.length ? allowed.join(', ') : 'none'}`
      )
    }
  }
}
