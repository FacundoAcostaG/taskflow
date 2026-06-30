import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()
const log = (message: string) => process.stdout.write(`${message}\n`)

async function main() {
  log('Seeding database...')

  // Users
  const passwordHash = await bcrypt.hash('Password1', 10)

  const alice = await prisma.user.upsert({
    where: { email: 'alice@taskflow.dev' },
    update: {},
    create: { email: 'alice@taskflow.dev', name: 'Alice', passwordHash },
  })

  const bob = await prisma.user.upsert({
    where: { email: 'bob@taskflow.dev' },
    update: {},
    create: { email: 'bob@taskflow.dev', name: 'Bob', passwordHash },
  })

  // E2E seed user referenced by CI tests
  const seed = await prisma.user.upsert({
    where: { email: 'seed@test.com' },
    update: {},
    create: { email: 'seed@test.com', name: 'Seed User', passwordHash },
  })

  log(`  OK Users: ${alice.email}, ${bob.email}, ${seed.email}`)

  // Main project owned by Alice
  const project = await prisma.project.upsert({
    where: { ownerId_name: { ownerId: alice.id, name: 'TaskFlow App' } },
    update: {},
    create: {
      name: 'TaskFlow App',
      description: 'Proyecto de ejemplo con tareas en distintos estados',
      ownerId: alice.id,
      members: {
        create: [
          { userId: alice.id, role: 'OWNER' },
          { userId: bob.id, role: 'MEMBER' },
        ],
      },
    },
  })

  // E2E project referenced by tests
  const seedProject = await prisma.project.upsert({
    where: { ownerId_name: { ownerId: seed.id, name: 'seed-project' } },
    update: {},
    create: {
      name: 'seed-project',
      description: 'Proyecto para tests E2E',
      ownerId: seed.id,
      members: { create: [{ userId: seed.id, role: 'OWNER' }] },
    },
  })

  log(`  OK Projects: "${project.name}", "${seedProject.name}"`)

  // Tasks
  const tasks = await Promise.all([
    prisma.task.create({
      data: {
        title: 'Configurar CI/CD',
        description: 'GitHub Actions para lint, tests y deploy automatico.',
        status: 'DONE',
        priority: 'HIGH',
        projectId: project.id,
        assignedTo: alice.id,
      },
    }),
    prisma.task.create({
      data: {
        title: 'Implementar autenticacion JWT',
        description: 'Registro, login y middleware de autorizacion.',
        status: 'DONE',
        priority: 'CRITICAL',
        projectId: project.id,
        assignedTo: alice.id,
      },
    }),
    prisma.task.create({
      data: {
        title: 'Agregar filtros de tareas',
        description: 'Filtrar por status, prioridad y busqueda full-text.',
        status: 'IN_PROGRESS',
        priority: 'MEDIUM',
        projectId: project.id,
        assignedTo: bob.id,
      },
    }),
    prisma.task.create({
      data: {
        title: 'Escribir tests E2E con Playwright',
        description: 'Cubrir flujos de registro, login y gestion de tareas.',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        projectId: project.id,
      },
    }),
    prisma.task.create({
      data: {
        title: 'Implementar contract tests con Pact',
        status: 'TODO',
        priority: 'MEDIUM',
        projectId: project.id,
      },
    }),
    prisma.task.create({
      data: {
        title: 'Optimizar queries de la base de datos',
        status: 'TODO',
        priority: 'LOW',
        projectId: project.id,
      },
    }),
    prisma.task.create({
      data: {
        title: 'Documentar API con OpenAPI',
        status: 'TODO',
        priority: 'LOW',
        projectId: project.id,
      },
    }),
  ])

  log(`  OK Tasks: ${tasks.length} created`)

  // Comments
  const taskInProgress = tasks[2]

  await prisma.comment.createMany({
    data: [
      {
        body: 'Empece con el filtro por status, funciona bien.',
        taskId: taskInProgress.id,
        authorId: bob.id,
      },
      {
        body: 'Falta implementar el full-text search, lo hago manana.',
        taskId: taskInProgress.id,
        authorId: bob.id,
      },
      {
        body: 'Revise el codigo, se ve bien. Acordate de agregar el test de integracion.',
        taskId: taskInProgress.id,
        authorId: alice.id,
      },
    ],
  })

  log('  OK Comments created')
  log('')
  log('Seed complete.')
  log('')
  log('  Test users (password: Password1)')
  log('  -> alice@taskflow.dev')
  log('  -> bob@taskflow.dev')
  log('  -> seed@test.com')
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
