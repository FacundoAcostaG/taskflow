import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { NextFunction } from 'express'
import { ZodError, ZodIssueCode } from 'zod'

const { authServiceInstance } = vi.hoisted(() => ({
  authServiceInstance: {
    verifyToken: vi.fn(),
  },
}))

vi.mock('../../src/services/auth.service', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('../../src/services/auth.service')>()
  return {
    ...actual,
    AuthService: vi.fn().mockImplementation(() => authServiceInstance),
  }
})

import {
  errorHandler,
  requireAuth,
  type AuthRequest,
} from '../../src/middleware/auth.middleware'

describe('auth middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when the authorization header is missing', () => {
    const next = vi.fn() as unknown as NextFunction
    const json = vi.fn()
    const res = {
      status: vi.fn().mockReturnValue({ json }),
    }

    requireAuth({ headers: {} } as AuthRequest, res as any, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(json).toHaveBeenCalledWith({
      error: 'Missing or invalid authorization header',
    })
  })

  it('stores userId and calls next for a valid bearer token', () => {
    authServiceInstance.verifyToken.mockReturnValue({ userId: 'user-1' })
    const next = vi.fn() as unknown as NextFunction
    const req = {
      headers: { authorization: 'Bearer valid-token' },
    } as AuthRequest

    requireAuth(req, {} as any, next)

    expect(req.userId).toBe('user-1')
    expect(authServiceInstance.verifyToken).toHaveBeenCalledWith('valid-token')
    expect(next).toHaveBeenCalledOnce()
  })

  it('returns 401 when token verification fails', () => {
    authServiceInstance.verifyToken.mockImplementation(() => {
      throw new Error('bad token')
    })
    const next = vi.fn() as unknown as NextFunction
    const json = vi.fn()
    const res = {
      status: vi.fn().mockReturnValue({ json }),
    }

    requireAuth(
      { headers: { authorization: 'Bearer bad-token' } } as AuthRequest,
      res as any,
      next
    )

    expect(res.status).toHaveBeenCalledWith(401)
    expect(json).toHaveBeenCalledWith({ error: 'Invalid or expired token' })
  })
})

describe('errorHandler', () => {
  let res: {
    status: ReturnType<typeof vi.fn>
    json: ReturnType<typeof vi.fn>
  }
  let next: NextFunction

  beforeEach(() => {
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    }
    next = vi.fn() as unknown as NextFunction
  })

  it('returns the provided status for known application errors', () => {
    const err = Object.assign(new Error('Forbidden'), { statusCode: 403 })

    errorHandler(err, {} as any, res as any, next)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledWith({ error: 'Forbidden' })
  })

  it('maps zod validation errors to a 400 payload', () => {
    const zodError = new ZodError([
      {
        code: ZodIssueCode.too_small,
        minimum: 3,
        type: 'string',
        inclusive: true,
        exact: false,
        message: 'String must contain at least 3 character(s)',
        path: ['name'],
      },
    ])

    errorHandler(zodError, {} as any, res as any, next)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      error: 'Validation error',
      details: expect.any(Array),
    })
  })

  it('hides internal details for unexpected errors', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    errorHandler(new Error('boom'), {} as any, res as any, next)

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' })
    expect(consoleSpy).toHaveBeenCalled()
  })
})
