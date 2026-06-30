import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { TaskService } from '../services/task.service'
import { requireAuth, AuthRequest } from '../middleware/auth.middleware'

const router = Router()
const prisma = new PrismaClient()
const taskService = new TaskService(prisma)

router.patch('/:taskId', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const task = await taskService.updateTask(
      req.params.taskId,
      req.userId!,
      req.body
    )
    res.json(task)
  } catch (err) {
    next(err)
  }
})

export default router
