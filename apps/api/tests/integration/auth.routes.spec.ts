// tests/integration/auth.routes.spec.ts
import { describe, it, expect, vi, MockedObject } from 'vitest'
import {
  description,
  feature,
  link,
  severity,
  step,
  story,
} from 'allure-vitest'
import request, { type Response } from 'supertest'
import { createApp } from '../../src/app'

// In a real project these tests run against a test database.
// Here we mock the services to keep tests fast and isolated.
// Integration tests with a real DB go in tests/integration/db/ using Testcontainers.

vi.mock('../../src/services/auth.service', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('../../src/services/auth.service')>()
  return {
    ...actual,
    AuthService: vi.fn().mockImplementation(() => ({
      register: vi.fn(),
      login: vi.fn(),
      verifyToken: vi.fn(),
    })),
  }
})

import {
  AuthService,
  ConflictError,
  UnauthorizedError,
} from '../../src/services/auth.service'

const app = createApp()

let authServiceMock: MockedObject<AuthService>
beforeAll(() => {
  authServiceMock = (AuthService as ReturnType<typeof vi.fn>).mock.results[0]
    .value
})

// ════════════════════════════════════════════════════════════════
// POST /api/auth/register
// ════════════════════════════════════════════════════════════════
describe('POST /api/auth/register', () => {
  it('201 — registro exitoso devuelve user y token', async (context) => {
    await feature(context, 'Autenticación')
    await story(context, 'US-01')
    await severity(context, 'critical')
    await link(
      context,
      'custom',
      'https://github.com/FacundoAcostaG/taskflow/blob/main/apps/api/src/routes/auth.routes.ts',
      'POST /api/auth/register'
    )
    await description(
      context,
      'Valida el happy path del endpoint de registro y confirma que la API expone usuario y token.'
    )

    authServiceMock.register.mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'ana@test.com',
        name: 'Ana',
        createdAt: new Date(),
      },
      token: 'jwt.token.here',
    })

    let res!: Response
    await step(
      context,
      'Enviar un registro válido al endpoint HTTP',
      async () => {
        res = await request(app)
          .post('/api/auth/register')
          .send({ email: 'ana@test.com', password: 'Password1', name: 'Ana' })
      }
    )

    await step(
      context,
      'Verificar el código 201 y el payload devuelto',
      async () => {
        expect(res.status).toBe(201)
        expect(res.body.token).toBeDefined()
        expect(res.body.user.email).toBe('ana@test.com')
      }
    )
  })

  it('409 — email ya registrado', async () => {
    authServiceMock.register.mockRejectedValue(
      new ConflictError('Email already registered')
    )

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'ana@test.com', password: 'Password1' })

    expect(res.status).toBe(409)
    expect(res.body.error).toMatch(/already registered/i)
  })

  it('400 — password débil', async () => {
    authServiceMock.register.mockRejectedValue(
      Object.assign(new Error('Validation error'), { statusCode: 400 })
    )

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'ana@test.com', password: 'weak' })

    expect(res.status).toBe(400)
  })

  it('400 — email con formato inválido', async () => {
    authServiceMock.register.mockRejectedValue(
      Object.assign(new Error('Invalid email format'), { statusCode: 400 })
    )

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'notanemail', password: 'Password1' })

    expect(res.status).toBe(400)
  })
})

// ════════════════════════════════════════════════════════════════
// POST /api/auth/login
// ════════════════════════════════════════════════════════════════
describe('POST /api/auth/login', () => {
  it('200 — login exitoso devuelve token', async () => {
    authServiceMock.login.mockResolvedValue({
      user: { id: 'user-1', email: 'ana@test.com', name: 'Ana' },
      token: 'jwt.token.here',
    })

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ana@test.com', password: 'Password1' })

    expect(res.status).toBe(200)
    expect(res.body.token).toBeDefined()
  })

  it('401 — credenciales incorrectas', async () => {
    authServiceMock.login.mockRejectedValue(
      new UnauthorizedError('Invalid credentials')
    )

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ana@test.com', password: 'Wrong1234' })

    expect(res.status).toBe(401)
    expect(res.body.error).toMatch(/invalid credentials/i)
  })

  it('401 — cuenta bloqueada', async (context) => {
    await feature(context, 'Autenticación')
    await story(context, 'US-02')
    await severity(context, 'normal')
    await link(
      context,
      'custom',
      'https://github.com/FacundoAcostaG/taskflow/blob/main/apps/api/src/routes/auth.routes.ts',
      'POST /api/auth/login locked account'
    )
    await description(
      context,
      'Asegura que la API comunica correctamente el estado de cuenta bloqueada en el login.'
    )

    authServiceMock.login.mockRejectedValue(
      new UnauthorizedError('Account locked. Try again in 14 minutes')
    )

    let res!: Response
    await step(
      context,
      'Intentar iniciar sesión con una cuenta bloqueada',
      async () => {
        res = await request(app)
          .post('/api/auth/login')
          .send({ email: 'ana@test.com', password: 'Password1' })
      }
    )

    await step(
      context,
      'Comprobar que la API responde 401 con mensaje de bloqueo',
      async () => {
        expect(res.status).toBe(401)
        expect(res.body.error).toMatch(/locked/i)
      }
    )
  })

  it('401 — endpoint de proyectos sin token devuelve 401', async () => {
    const res = await request(app).get('/api/projects')
    expect(res.status).toBe(401)
  })
})
