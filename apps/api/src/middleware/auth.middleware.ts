import { Request, Response, NextFunction } from 'express'
import { AuthService } from '../services/auth.service'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const authService = new AuthService(prisma)

type HttpError = Error & {
  statusCode?: number
}

export interface AuthRequest extends Request {
  userId?: string
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' })
  }

  const token = authHeader.slice(7)
  try {
    const payload = authService.verifyToken(token)
    req.userId = payload.userId
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  const status = (err as HttpError).statusCode ?? 500
  const message = status === 500 ? 'Internal server error' : err.message

  if (status === 500) console.error(err)

  // Handle Zod validation errors
  if (err.name === 'ZodError') {
    return res.status(400).json({ error: 'Validation error', details: JSON.parse(err.message) })
  }

  return res.status(status).json({ error: message })
}
