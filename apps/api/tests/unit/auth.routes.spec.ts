import { beforeEach, describe, expect, it, vi, type MockedObject } from 'vitest'
import request from 'supertest'

const { authServiceInstance } = vi.hoisted(() => ({
  authServiceInstance: {
    register: vi.fn(),
    login: vi.fn(),
    verifyToken: vi.fn(),
  },
}))

vi.mock('../../src/services/auth.service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/services/auth.service')>()
  return {
    ...actual,
    AuthService: vi.fn().mockImplementation(() => authServiceInstance),
  }
})

import { createApp } from '../../src/app'
import { AuthService, UnauthorizedError } from '../../src/services/auth.service'

const app = createApp()

describe('auth routes', () => {
  let authServiceMock: MockedObject<AuthService>

  beforeEach(() => {
    vi.clearAllMocks()
    authServiceMock = authServiceInstance as MockedObject<AuthService>
  })

  it('registers a user', async () => {
    authServiceMock.register.mockResolvedValue({
      user: { id: 'user-1', email: 'ana@test.com', name: 'Ana' },
      token: 'jwt.token',
    } as any)

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'ana@test.com', password: 'Password1' })

    expect(res.status).toBe(201)
    expect(authServiceMock.register).toHaveBeenCalledWith({
      email: 'ana@test.com',
      password: 'Password1',
    })
  })

  it('logs in a user', async () => {
    authServiceMock.login.mockResolvedValue({
      user: { id: 'user-1', email: 'ana@test.com', name: 'Ana' },
      token: 'jwt.token',
    } as any)

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ana@test.com', password: 'Password1' })

    expect(res.status).toBe(200)
    expect(authServiceMock.login).toHaveBeenCalledWith({
      email: 'ana@test.com',
      password: 'Password1',
    })
  })

  it('returns 401 when login fails', async () => {
    authServiceMock.login.mockRejectedValue(
      new UnauthorizedError('Invalid credentials')
    )

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ana@test.com', password: 'wrong' })

    expect(res.status).toBe(401)
    expect(res.body.error).toBe('Invalid credentials')
  })
})
