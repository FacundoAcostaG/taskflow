import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import request from 'supertest'
import { createApp } from '../../src/app'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const app = createApp()

// US-03 y US-04:
// esta suite valida creación y listado de proyectos contra la API real.
describe('Proyectos API — US-03 y US-04', () => {
  let token: string
  let userId: string
  const suiteEmails = ['tester@test.com', 'otro@test.com']

  beforeAll(async () => {
    await prisma.task.deleteMany()
    await prisma.project.deleteMany()
    await prisma.user.deleteMany({ where: { email: { in: suiteEmails } } })

    // Registrar un usuario una sola vez para toda la suite.
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'tester@test.com', password: 'Test1234!' })

    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('token')
    expect(res.body.user).toHaveProperty('id')

    token = res.body.token
    userId = res.body.user.id
  })

  beforeEach(async () => {
    // Limpiar en orden correcto para evitar conflictos por foreign keys.
    await prisma.task.deleteMany()
    await prisma.project.deleteMany()
  })

  afterAll(async () => {
    await prisma.task.deleteMany()
    await prisma.project.deleteMany()
    await prisma.user.deleteMany({ where: { email: { in: suiteEmails } } })
    await prisma.$disconnect()
  })

  // US-03 happy path: un usuario autenticado crea un proyecto
  // y recibe el recurso con id y owner asociados.
  it('crea un proyecto y devuelve 201 con id (@US-03)', async () => {
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'TaskFlow MVP', description: 'Primer sprint' })

    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('id')
    expect(res.body.name).toBe('TaskFlow MVP')
    expect(res.body.ownerId).toBe(userId)
  })

  // US-03 error: rechaza payload inválido cuando falta el nombre.
  it('rechaza nombre vacío con 400 (@US-03)', async () => {
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: '', description: 'Sin nombre' })

    expect(res.status).toBe(400)
    expect(res.body.error).toMatch('Validation error')
  })

  // US-03 error: no permite crear proyectos sin autenticación.
  it('rechaza petición sin token con 401 (@US-03)', async () => {
    const res = await request(app)
      .post('/api/projects')
      .send({ name: 'Proyecto sin auth' })

    expect(res.status).toBe(401)
  })

  // US-04 happy path: el listado devuelve solo los proyectos del usuario autenticado.
  it('solo devuelve los proyectos del usuario autenticado (@US-04)', async () => {
    await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Proyecto de tester1' })

    const res2 = await request(app)
      .post('/api/auth/register')
      .send({ email: 'otro@test.com', password: 'Test1234!' })
    expect(res2.status).toBe(201)
    expect(res2.body).toHaveProperty('token')
    const token2 = res2.body.token

    const list = await request(app)
      .get('/api/projects')
      .set('Authorization', `Bearer ${token2}`)

    expect(list.status).toBe(200)
    expect(Array.isArray(list.body)).toBe(true)
    expect(list.body).toHaveLength(0)
  })

  // US-04 error: el endpoint de listado requiere token válido.
  it('rechaza listado sin token con 401 (@US-04)', async () => {
    const res = await request(app).get('/api/projects')

    expect(res.status).toBe(401)
  })

  // US-04 error: un token inválido no autoriza el acceso al listado.
  it('rechaza token inválido al listar con 401 (@US-04)', async () => {
    const res = await request(app)
      .get('/api/projects')
      .set('Authorization', 'Bearer token-invalido')

    expect(res.status).toBe(401)
  })
})
