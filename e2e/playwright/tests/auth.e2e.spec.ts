// e2e/tests/auth.e2e.spec.ts
import { test, expect } from '@playwright/test'

// ── US-01 / US-02: Auth flow E2E ──────────────────────────────
test.describe('Flujo de autenticación', () => {

  test('usuario puede registrarse e iniciar sesión', async ({ page }) => {
    const email = `e2e-${Date.now()}@test.com`

    // Ir a la página de registro
    await page.goto('/register')
    await expect(page).toHaveTitle(/TaskFlow/)

    // Completar formulario de registro
    await page.getByTestId('register-name').fill('E2E User')
    await page.getByTestId('register-email').fill(email)
    await page.getByTestId('register-password').fill('Password1')
    await page.getByTestId('register-submit').click();

    // Debe redirigir al dashboard
    await expect(page).toHaveURL('/login')
  })

  test('muestra error con contraseña débil', async ({ page }) => {
    await page.goto('/register')

    await page.getByTestId('register-name').fill('E2E User')
    await page.getByTestId('register-email').fill('test@test.com')
    await page.getByTestId('register-password').fill('weak')
    await page.getByTestId('register-submit').click()

    await expect(page.getByTestId('register-error')).toBeVisible()
    await expect(page).toHaveURL('/register') // no redirige
  })

  test('usuario puede hacer login con credenciales válidas', async ({ page }) => {
    await page.goto('/login')

    await page.getByTestId('login-email').fill('alice@taskflow.dev') // usuario del seed
    await page.getByTestId('login-password').fill('Password1')
    await page.getByTestId('login-submit').click();

    await expect(page).toHaveURL('/projects')
  })

  test('muestra error con credenciales inválidas', async ({ page }) => {
    await page.goto('/login')

    await page.getByTestId('login-email').fill('seed@test.com')
    await page.getByTestId('login-password').fill('WrongPass1')
    await page.getByTestId('login-submit').click();

    await expect(await page.getByTestId('login-error')).toBeVisible()
    await expect(page).toHaveURL('/login')
  })
})

// ── US-05 / US-06: Task flow E2E ─────────────────────────────
test.describe('Flujo de tareas', () => {

  test.beforeEach(async ({ page }) => {
    // Login antes de cada test
    await page.goto('/login')
    await page.getByTestId('login-email').fill('seed@test.com')
    await page.getByTestId('login-password').fill('Password1')
    await page.getByTestId('login-submit').click()
    await expect(page).toHaveURL('/projects')
  })

  test('crear tarea y verificar estado inicial TODO', async ({ page }) => {
    await page.goto('/projects')
    await page.getByRole('heading', { name: 'seed-project' }).click();
    await page.getByTestId('create-task-btn').click();

    await page.getByTestId('task-title-input').fill('Mi primera tarea E2E')
    await page.locator('form').getByRole('combobox').selectOption('HIGH');
    await page.getByTestId('task-submit').click();

    const task = page.getByText('Mi primera tarea E2E')
    await expect(task).toBeVisible()

    const badge = page.getByTestId('task-card').getByText('TODO')
    await expect(badge).toContainText('TODO')
  })

  test('mover tarea de TODO a IN_PROGRESS', async ({ page }) => {
    await page.goto('/projects')
    await page.getByRole('heading', { name: 'seed-project' }).click();

    const task = page.getByText('seed-project').first()
    await task.click()

    await page.getByRole('button', { name: 'Iniciar' }).click()
    await expect(page.getByTestId('status-badge')).toContainText('IN_PROGRESS')
  })

  test('no puede ir de TODO a DONE directamente', async ({ page }) => {
    await page.goto('/projects')
    await page.getByRole('heading', { name: 'seed-project' }).click();

    const task = page.getByText('seed-project').first()
    await task.click()

    // El botón "Completar" no debe existir si la tarea está en TODO
    await expect(page.getByRole('button', { name: 'Completar' })).not.toBeVisible()
  })
})
