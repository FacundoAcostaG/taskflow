import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { TestService } from '../services/test.service'

const router = Router()
const prisma = new PrismaClient()
const testService = new TestService(prisma)

router.post('/reset', async (req: any, res, next) => {
  try {
    const task = await testService.deleteAllData()
    res.json(task)
  } catch (err) {
    next(err)
  }
})

export default router
