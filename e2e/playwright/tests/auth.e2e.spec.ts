import { test, expect, type Page } from '@playwright/test'

const baseURL = process.env.BASE_URL || 'http://localhost:5173'
const apiURL = process.env.API_URL || 'http://localhost:3001'
const RUN_ID = `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

const SHARED_USER = {
  email: 'seed@test.com',
  password: 'Password1',
  projectName: 'seed-project',
}

async function loginAsSharedUser(page: Page) {
  await page.goto(`${baseURL}/login`)
  await page.getByTestId('login-email').fill(SHARED_USER.email)
  await page.getByTestId('login-password').fill(SHARED_USER.password)
  await page.getByTestId('login-submit').click()
  await expect(page).toHaveURL(`${baseURL}/projects`)
}

async function openSharedProject(page: Page) {
  await page.goto(`${baseURL}/projects`)
  await page.getByRole('heading', { name: SHARED_USER.projectName }).click()
}

async function createTask(page: Page, title: string, priority = 'HIGH') {
  await page.getByTestId('create-task-btn').click()
  await page.getByTestId('task-title-input').fill(title)
  await page.locator('form').getByRole('combobox').selectOption(priority)
  await page.getByTestId('task-submit').click()
}

// US-01 / US-02: Auth flow E2E
test.describe('Flujo de autenticación', () => {
  test.beforeAll(async ({ request }) => {
    // Garantiza que el usuario compartido exista si el entorno no fue seed-eado.
    await request.post(`${apiURL}/api/auth/register`, {
      data: {
        name: 'Seed User',
        email: SHARED_USER.email,
        password: SHARED_USER.password,
      },
      failOnStatusCode: false,
    })

    // Garantiza también un proyecto base compartido para los tests de tareas.
    const loginRes = await request.post(`${apiURL}/api/auth/login`, {
      data: {
        email: SHARED_USER.email,
        password: SHARED_USER.password,
      },
    })

    if (loginRes.ok()) {
      const { token } = await loginRes.json()
      await request.post(`${apiURL}/api/projects`, {
        data: {
          name: SHARED_USER.projectName,
          description: 'Proyecto compartido para tests E2E',
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
        failOnStatusCode: false,
      })
    }
  })

  test('usuario puede registrarse e iniciar sesión', async ({ page }) => {
    const email = `${RUN_ID}@test.com`

    await page.goto(`${baseURL}/register`)
    await expect(page).toHaveTitle(/TaskFlow/)

    await page.getByTestId('register-name').fill('E2E User')
    await page.getByTestId('register-email').fill(email)
    await page.getByTestId('register-password').fill('Password1')
    await page.getByTestId('register-submit').click()

    await expect(page).toHaveURL(`${baseURL}/login`)

    // Todos los logins de la suite usan el mismo usuario compartido.
    await page.getByTestId('login-email').fill(SHARED_USER.email)
    await page.getByTestId('login-password').fill(SHARED_USER.password)
    await page.getByTestId('login-submit').click()

    await expect(page).toHaveURL(`${baseURL}/projects`)
  })

  test('muestra error con contraseña débil', async ({ page }) => {
    await page.goto(`${baseURL}/register`)

    await page.getByTestId('register-name').fill('E2E User')
    await page.getByTestId('register-email').fill(`${RUN_ID}@test.com`)
    await page.getByTestId('register-password').fill('weak')
    await page.getByTestId('register-submit').click()

    await expect(page.getByTestId('register-error')).toBeVisible()
    await expect(page).toHaveURL(`${baseURL}/register`)
  })

  test('usuario puede hacer login con credenciales válidas', async ({
    page,
  }) => {
    await loginAsSharedUser(page)
  })

  test('muestra error con credenciales inválidas', async ({ page }) => {
    await page.goto(`${baseURL}/login`)

    await page.getByTestId('login-email').fill(SHARED_USER.email)
    await page.getByTestId('login-password').fill('WrongPass1')
    await page.getByTestId('login-submit').click()

    await expect(page.getByTestId('login-error')).toBeVisible()
    await expect(page).toHaveURL(`${baseURL}/login`)
  })
})

// US-05 / US-06: Task flow E2E
test.describe('Flujo de tareas', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsSharedUser(page)
    await openSharedProject(page)
  })

  test('crear tarea y verificar estado inicial TODO', async ({ page }) => {
    const taskTitle = `Mi tarea E2E ${Date.now()}`

    await createTask(page, taskTitle)

    const taskCard = page
      .getByTestId('task-card')
      .filter({ hasText: taskTitle })
    await expect(taskCard).toBeVisible()
    await expect(taskCard).toContainText('TODO')
  })

  test('mover tarea de TODO a IN_PROGRESS', async ({ page }) => {
    const taskTitle = `Mover tarea E2E ${Date.now()}`

    await createTask(page, taskTitle)

    const taskCard = page
      .getByTestId('task-card')
      .filter({ hasText: taskTitle })
    await taskCard.click()

    await page.getByRole('button', { name: /IN_PROGRESS/ }).click()

    // Si el estado cambió correctamente, la tarea en detalle debe ofrecer DONE como próximo paso.
    await expect(page.getByRole('button', { name: /DONE/ })).toBeVisible()
  })

  test('no puede ir de TODO a DONE directamente', async ({ page }) => {
    const taskTitle = `Bloquear DONE E2E ${Date.now()}`

    await createTask(page, taskTitle)

    const taskCard = page
      .getByTestId('task-card')
      .filter({ hasText: taskTitle })
    await taskCard.click()

    await expect(page.getByRole('button', { name: /DONE/ })).not.toBeVisible()
  })
})
