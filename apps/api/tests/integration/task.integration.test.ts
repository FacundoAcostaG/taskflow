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
    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'tester-tasks@test.com', password: 'Test1234!' });
    token = res.body.token;
  });

  beforeEach(async () => {
    await prisma.task.deleteMany();
    await prisma.project.deleteMany();

    const res = await request(app)
      .post('/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Proyecto para tareas' });
    projectId = res.body.id;
  });

  afterAll(async () => {
    await prisma.task.deleteMany();
    await prisma.project.deleteMany();
    await prisma.$disconnect();
  });

  it('crea una tarea con prioridad válida (@US-05)', async () => {
    const res = await request(app)
      .post(`/projects/${projectId}/tasks`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Implementar login', priority: 'HIGH' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.priority).toBe('HIGH');
  });

  it('rechaza prioridad inválida con 400 (@US-05)', async () => {
    const res = await request(app)
      .post(`/projects/${projectId}/tasks`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Tarea mala', priority: 'ULTRA' });

    expect(res.status).toBe(400);
  });
});
