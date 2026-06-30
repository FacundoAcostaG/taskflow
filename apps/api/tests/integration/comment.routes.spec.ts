import { beforeEach, describe, expect, it, vi } from 'vitest'
import request from 'supertest'
import { ZodError, ZodIssueCode } from 'zod'

const { authServiceInstance, commentServiceInstance } = vi.hoisted(() => ({
  authServiceInstance: {
    verifyToken: vi.fn(),
  },
  commentServiceInstance: {
    getComments: vi.fn(),
    addComment: vi.fn(),
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

vi.mock('../../src/services/comment.service', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('../../src/services/comment.service')>()
  return {
    ...actual,
    CommentService: vi.fn().mockImplementation(() => commentServiceInstance),
  }
})

import { createApp } from '../../src/app'
import { ForbiddenError } from '../../src/services/auth.service'

const app = createApp()
const authHeader = { Authorization: 'Bearer valid-token' }

// US-08:
// esta suite prueba el acceso HTTP a comentarios de tareas.
describe('Comentarios API — US-08', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authServiceInstance.verifyToken.mockReturnValue({ userId: 'user-1' })
  })

  // US-08 happy path: un miembro autenticado puede listar comentarios.
  it('lista comentarios con 200 (@US-08)', async () => {
    commentServiceInstance.getComments.mockResolvedValue([
      {
        id: 'comment-1',
        body: 'Buen avance',
        taskId: 'task-1',
        authorId: 'user-1',
        createdAt: new Date(),
        author: {
          id: 'user-1',
          email: 'ana@test.com',
          name: 'Ana',
        },
      },
    ])

    const res = await request(app)
      .get('/api/projects/project-1/tasks/task-1/comments')
      .set(authHeader)

    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body).toHaveLength(1)
    expect(commentServiceInstance.getComments).toHaveBeenCalledWith(
      'task-1',
      'user-1'
    )
  })

  // US-08 error: rechaza comentarios con body inválido.
  it('rechaza comentario inválido con 400 (@US-08)', async () => {
    commentServiceInstance.addComment.mockRejectedValueOnce(
      new ZodError([
        {
          code: ZodIssueCode.too_small,
          path: ['body'],
          message: 'String must contain at least 1 character(s)',
          minimum: 1,
          type: 'string',
          inclusive: true,
        },
      ])
    )

    const res = await request(app)
      .post('/api/projects/project-1/tasks/task-1/comments')
      .set(authHeader)
      .send({ body: '' })

    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Validation error')
  })

  // US-08 error: un no-miembro no puede acceder a comentarios del proyecto.
  it('rechaza acceso de no miembro con 403 (@US-08)', async () => {
    commentServiceInstance.getComments.mockRejectedValueOnce(
      new ForbiddenError('Not a project member')
    )

    const res = await request(app)
      .get('/api/projects/project-1/tasks/task-1/comments')
      .set(authHeader)

    expect(res.status).toBe(403)
    expect(res.body.error).toMatch(/not a project member/i)
  })

  // US-08 error: el acceso a comentarios requiere token válido.
  it('rechaza petición sin token con 401 (@US-08)', async () => {
    const res = await request(app).get(
      '/api/projects/project-1/tasks/task-1/comments'
    )

    expect(res.status).toBe(401)
  })
})
