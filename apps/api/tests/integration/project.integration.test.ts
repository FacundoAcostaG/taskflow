import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const app = createApp();

describe('Proyectos API — US-03 y US-04', () => {
    let token: string;
    let userId: string;

    beforeAll(async () => {
        // Registrar un usuario una sola vez para toda la suite
        const res = await request(app)
            .post('/api/auth/register')
            .send({ email: 'tester@test.com', password: 'Test1234!' });
        token = res.body.token;
        userId = res.body.user.id;
    });

    beforeEach(async () => {
        // Limpiar en orden correcto (foreign keys)
        await prisma.task.deleteMany();
        await prisma.project.deleteMany();
    });

    afterAll(async () => {
        await prisma.task.deleteMany();
        await prisma.project.deleteMany();
        await prisma.user.deleteMany();
        await prisma.$disconnect();
    });


    it('crea un proyecto y devuelve 201 con id (@US-03)', async () => {
        const res = await request(app)
            .post('/api/projects')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'TaskFlow MVP', description: 'Primer sprint' });

        // verificar status
        expect(res.status).toBe(201);

        // verificar que el body tiene id y name
        expect(res.body).toHaveProperty('id');
        expect(res.body.name).toBe('TaskFlow MVP');

        // verificar que el ownerId corresponde al usuario logueado
        expect(res.body.ownerId).toBe(userId);
    });

    it('rechaza nombre vacío con 400 (@US-03)', async () => {
        const res = await request(app)
            .post('/api/projects')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: '', description: 'Sin nombre' });
        expect(res.status).toBe(400);
        expect(res.body.error).toMatch("Validation error");
    });

    it('rechaza petición sin token con 401 (@US-03)', async () => {
        const res = await request(app)
            .post('/api/projects')
            .send({ name: 'Proyecto sin auth' });

        expect(res.status).toBe(401);
    });

    it('solo devuelve los proyectos del usuario autenticado (@US-04)', async () => {
        // Crear proyecto del primer usuario
        await request(app).post('/api/projects')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'Proyecto de tester1' });

        // Crear un segundo usuario
        const res2 = await request(app).post('/api/auth/register')
            .send({ email: 'otro@test.com', password: 'Test1234!' });
        const token2 = res2.body.token;

        // El segundo usuario lista SUS proyectos
        const list = await request(app).get('/api/projects')
            .set('Authorization', `Bearer ${token2}`);

        expect(list.status).toBe(200);
        expect(Array.isArray(list.body)).toBe(true);
        expect(list.body).toHaveLength(0);
    });


});
