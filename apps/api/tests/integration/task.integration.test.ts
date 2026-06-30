import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import request from 'supertest'
import { createApp } from '../../src/app'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const app = createApp()

// US-05:
// esta suite usa Prisma + HTTP real para validar creación de tareas.
describe('Tareas API — US-05', () => {
  let token: string
  let projectId: string

  beforeAll(async () => {
    await prisma.task.deleteMany()
    await prisma.project.deleteMany()
    await prisma.user.deleteMany({ where: { email: 'tester-tasks@test.com' } })

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'tester-tasks@test.com', password: 'Test1234!' })

    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('token')
    expect(res.body.user).toHaveProperty('id')

    token = res.body.token
  })

  beforeEach(async () => {
    await prisma.task.deleteMany()
    await prisma.project.deleteMany()

    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Proyecto para tareas' })

    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('id')

    projectId = res.body.id
  })

  afterAll(async () => {
    await prisma.task.deleteMany()
    await prisma.project.deleteMany()
    await prisma.user.deleteMany({ where: { email: 'tester-tasks@test.com' } })
    await prisma.$disconnect()
  })

  // US-05 happy path: crea una tarea con una prioridad permitida.
  it('crea una tarea con prioridad válida (@US-05)', async () => {
    const res = await request(app)
      .post(`/api/projects/${projectId}/tasks`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Implementar login', priority: 'HIGH' })

    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('id')
    expect(res.body.priority).toBe('HIGH')
  })

  // US-05 error: rechaza prioridades fuera del enum permitido.
  it('rechaza prioridad inválida con 400 (@US-05)', async () => {
    const res = await request(app)
      .post(`/api/projects/${projectId}/tasks`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Tarea mala', priority: 'ULTRA' })

    expect(res.status).toBe(400)
  })

  // US-05 error: crear tareas requiere autenticación.
  it('rechaza crear tarea sin token con 401 (@US-05)', async () => {
    const res = await request(app)
      .post(`/api/projects/${projectId}/tasks`)
      .send({ title: 'Implementar login', priority: 'HIGH' })

    expect(res.status).toBe(401)
  })
})
