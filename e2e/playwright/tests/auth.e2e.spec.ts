// e2e/tests/auth.e2e.spec.ts
import { test, expect } from '@playwright/test'
const baseURL = process.env.BASE_URL || 'http://localhost:5173'
const RUN_ID = `e2e-${Date.now()}`;

// ── US-01 / US-02: Auth flow E2E ──────────────────────────────
test.describe('Flujo de autenticación', () => {

  test('usuario puede registrarse e iniciar sesión', async ({ page }) => {
    const email = `${RUN_ID}@test.com`

    // Ir a la página de registro
    await page.goto(`${baseURL}/register`)
    console.log(page.url())
    await expect(page).toHaveTitle(/TaskFlow/)

    // Completar formulario de registro
    await page.getByTestId('register-name').fill('E2E User')
    await page.getByTestId('register-email').fill(email)
    await page.getByTestId('register-password').fill('Password1')
    await page.getByTestId('register-submit').click();

    // Debe redirigir al dashboard
    await expect(page).toHaveURL(`${baseURL}/login`)
  })

  test('muestra error con contraseña débil', async ({ page }) => {
    await page.goto(`${baseURL}/register`)

    await page.getByTestId('register-name').fill('E2E User')
    await page.getByTestId('register-email').fill(`${RUN_ID}@test.com`)
    await page.getByTestId('register-password').fill('weak')
    await page.getByTestId('register-submit').click()

    await expect(page.getByTestId('register-error')).toBeVisible()
    await expect(page).toHaveURL(`${baseURL}/register`) // no redirige
  })

  test('usuario puede hacer login con credenciales válidas', async ({ page }) => {
    await page.goto(`${baseURL}/login`)

    await page.getByTestId('login-email').fill('alice@taskflow.dev') // usuario del seed
    await page.getByTestId('login-password').fill('Password1')
    await page.getByTestId('login-submit').click();

    await expect(page).toHaveURL(`${baseURL}/projects`)
  })

  test('muestra error con credenciales inválidas', async ({ page }) => {
    await page.goto(`${baseURL}/login`)

    await page.getByTestId('login-email').fill(`${RUN_ID}@test.com`)
    await page.getByTestId('login-password').fill('WrongPass1')
    await page.getByTestId('login-submit').click();

    await expect(await page.getByTestId('login-error')).toBeVisible()
    await expect(page).toHaveURL(`${baseURL}/login`)
  })
})

// ── US-05 / US-06: Task flow E2E ─────────────────────────────
test.describe('Flujo de tareas', () => {

  test.beforeEach(async ({ page }) => {
    // Login antes de cada test
    await page.goto(`${baseURL}/login`)
    await page.getByTestId('login-email').fill(`${RUN_ID}@test.com`)
    await page.getByTestId('login-password').fill('Password1')
    await page.getByTestId('login-submit').click()
    await expect(page).toHaveURL(`${baseURL}/projects`)
  })

  test('crear tarea y verificar estado inicial TODO', async ({ page }) => {
    await page.goto(`${baseURL}/projects`)
    await page.getByTestId('create-project-btn').click();
    await page.getByTestId('project-name-input').fill('seed-project');
    await page.getByTestId('project-submit').click();

    await page.getByRole('heading', { name: 'seed-project' }).click();
    await page.getByTestId('create-task-btn').click();

    await page.getByTestId('task-title-input').fill('Mi primera tarea E2E')
    await page.locator('form').getByRole('combobox').selectOption('HIGH');
    await page.getByTestId('task-submit').click();


    await page.getByTestId('task-title-input').fill('Mi segunda tarea E2E')
    await page.locator('form').getByRole('combobox').selectOption('HIGH');
    await page.getByTestId('task-submit').click();
    const task = page.getByText('Mi primera tarea E2E').first()

    await expect(task).toBeVisible()

    const badge = page.locator('.text-xs.font-medium.text-teal-700').first()
    await expect(badge).toContainText('TODO')
  })

  test('mover tarea de TODO a IN_PROGRESS', async ({ page }) => {
    await page.goto(`${baseURL}/projects`)
    await page.getByRole('heading', { name: 'seed-project' }).click();

    const task = page.locator('.font-medium').first();
    await task.click()

    await page.getByTestId('task-status-select').click();
    await page.getByRole('button', { name: '→ DONE' }).isVisible(); //debe aparecer el estado DONE
    
  })

  test('no puede ir de TODO a DONE directamente', async ({ page }) => {
    await page.goto(`${baseURL}/projects`)
    await page.getByRole('heading', { name: 'seed-project' }).click();

    const task = page.getByTestId('task-card').last()
    await task.click()

    // El botón "done" no debe existir si la tarea está en TODO
    await expect(page.getByRole('button', { name: '→ DONE' })).not.toBeVisible()
  })
})
