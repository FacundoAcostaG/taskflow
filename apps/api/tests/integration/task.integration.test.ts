import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const app = createApp();

describe('Tareas API — US-05', () => {
  let token: string;
  let projectId: string;

  beforeAll(async () => {
    await prisma.task.deleteMany();
    await prisma.project.deleteMany();
    await prisma.user.deleteMany({ where: { email: 'tester-tasks@test.com' } });
  });

  beforeEach(async () => {
    await prisma.task.deleteMany();
    await prisma.project.deleteMany();
    await prisma.user.deleteMany({ where: { email: 'tester-tasks@test.com' } });

    const authRes = await request(app)
      .post('/api/auth/register')
      .send({ email: 'tester-tasks@test.com', password: 'Test1234!' });
    token = authRes.body.token;

    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Proyecto para tareas' });
    projectId = res.body.id;
  });

  afterAll(async () => {
    await prisma.task.deleteMany();
    await prisma.project.deleteMany();
    await prisma.user.deleteMany({ where: { email: 'tester-tasks@test.com' } });
    await prisma.$disconnect();
  });

  it('rechaza prioridad inválida con 400 (@US-05)', async () => {
    const res = await request(app)
      .post(`/api/projects/${projectId}/tasks`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Tarea mala', priority: 'ULTRA' });

    expect(res.status).toBe(400);
  });

  it('crea una tarea con prioridad válida (@US-05)', async () => { // tira error de "not a project member"
    const res = await request(app)
      .post(`/api/projects/${projectId}/tasks`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Implementar login', priority: 'HIGH' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.priority).toBe('HIGH');
  });

});
