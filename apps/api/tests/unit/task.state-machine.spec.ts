// tests/unit/task.state-machine.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Status } from '../../src/prisma/enums'
import { TaskService } from '../../src/services/task.service'
import { UnprocessableError } from '../../src/services/auth.service'

const mockMember = { userId: 'user-1', role: 'MEMBER' }

function makeTask(status: Status, assignedTo = 'user-1') {
  return {
    id: 'task-1',
    title: 'Test task',
    status,
    priority: 'MEDIUM',
    projectId: 'proj-1',
    assignedTo,
    project: { members: [mockMember] },
  }
}

const mockDb = {
  task: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  statusHistory: { create: vi.fn() },
  projectMember: { findUnique: vi.fn() },
}

const taskService = new TaskService(mockDb as any)

// ════════════════════════════════════════════════════════════════
// US-06: Máquina de estados
// ════════════════════════════════════════════════════════════════
describe('TaskService — máquina de estados (US-06)', () => {

  beforeEach(() => {
    mockDb.statusHistory.create.mockResolvedValue({})
    mockDb.task.update.mockResolvedValue({ id: 'task-1' })
  })

  describe('Transiciones VÁLIDAS', () => {
    it('TODO → IN_PROGRESS ✓', async () => {
      mockDb.task.findUnique.mockResolvedValue(makeTask(Status.TODO))

      await expect(
        taskService.updateTask('task-1', 'user-1', { status: Status.IN_PROGRESS })
      ).resolves.toBeDefined()
    })

    it('IN_PROGRESS → DONE ✓', async () => {
      mockDb.task.findUnique.mockResolvedValue(makeTask(Status.IN_PROGRESS))

      await expect(
        taskService.updateTask('task-1', 'user-1', { status: Status.DONE })
      ).resolves.toBeDefined()
    })

    it('IN_PROGRESS → TODO ✓ (reabrir tarea en progreso)', async () => {
      mockDb.task.findUnique.mockResolvedValue(makeTask(Status.IN_PROGRESS))

      await expect(
        taskService.updateTask('task-1', 'user-1', { status: Status.TODO })
      ).resolves.toBeDefined()
    })
  })

  describe('Transiciones INVÁLIDAS', () => {
    it('TODO → DONE ✗ (saltar IN_PROGRESS)', async () => {
      mockDb.task.findUnique.mockResolvedValue(makeTask(Status.TODO))

      await expect(
        taskService.updateTask('task-1', 'user-1', { status: Status.DONE })
      ).rejects.toThrow(UnprocessableError)
    })

    it('TODO → DONE: mensaje de error describe la transición', async () => {
      mockDb.task.findUnique.mockResolvedValue(makeTask(Status.TODO))

      await expect(
        taskService.updateTask('task-1', 'user-1', { status: Status.DONE })
      ).rejects.toThrow('TODO → DONE')
    })

    // 🐛 Este test FALLA con BUG-01 activo si la ruta permite force:true
    // En el service puro DONE→TODO lanza error correctamente,
    // pero el bug está habilitado a nivel de ruta
    it('DONE → TODO ✗ (no se puede reabrir una tarea cerrada)', async () => {
      mockDb.task.findUnique.mockResolvedValue(makeTask(Status.DONE))

      await expect(
        taskService.updateTask('task-1', 'user-1', { status: Status.TODO })
      ).rejects.toThrow(UnprocessableError)
    })

    it('DONE → IN_PROGRESS ✗', async () => {
      mockDb.task.findUnique.mockResolvedValue(makeTask(Status.DONE))

      await expect(
        taskService.updateTask('task-1', 'user-1', { status: Status.IN_PROGRESS })
      ).rejects.toThrow(UnprocessableError)
    })

    it('mensaje de error DONE menciona que no hay transiciones permitidas', async () => {
      mockDb.task.findUnique.mockResolvedValue(makeTask(Status.DONE))

      await expect(
        taskService.updateTask('task-1', 'user-1', { status: Status.TODO })
      ).rejects.toThrow('none')
    })
  })

  describe('Registro de historial', () => {
    it('registra la transición en statusHistory', async () => {
      mockDb.task.findUnique.mockResolvedValue(makeTask(Status.TODO))

      await taskService.updateTask('task-1', 'user-1', { status: Status.IN_PROGRESS })

      expect(mockDb.statusHistory.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          taskId: 'task-1',
          from: 'TODO',
          to: 'IN_PROGRESS',
          changedBy: 'user-1',
        }),
      })
    })

    it('no registra historial si el estado no cambia', async () => {
      mockDb.task.findUnique.mockResolvedValue(makeTask(Status.TODO))

      await taskService.updateTask('task-1', 'user-1', { title: 'Nuevo título' })

      expect(mockDb.statusHistory.create).not.toHaveBeenCalled()
    })
  })
})
