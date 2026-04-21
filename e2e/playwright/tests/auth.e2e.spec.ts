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
    await page.getByLabel('Email').fill(email)
    await page.getByLabel('Password').fill('Password1')
    await page.getByLabel('Name').fill('E2E User')
    await page.getByRole('button', { name: 'Registrarse' }).click()

    // Debe redirigir al dashboard
    await expect(page).toHaveURL('/dashboard')
    await expect(page.getByText('E2E User')).toBeVisible()
  })

  test('muestra error con contraseña débil', async ({ page }) => {
    await page.goto('/register')

    await page.getByLabel('Email').fill('test@test.com')
    await page.getByLabel('Password').fill('weak')
    await page.getByRole('button', { name: 'Registrarse' }).click()

    await expect(page.getByRole('alert')).toContainText(/contraseña/i)
    await expect(page).toHaveURL('/register') // no redirige
  })

  test('usuario puede hacer login con credenciales válidas', async ({ page }) => {
    await page.goto('/login')

    await page.getByLabel('Email').fill('seed@test.com') // usuario del seed
    await page.getByLabel('Password').fill('Password1')
    await page.getByRole('button', { name: 'Iniciar sesión' }).click()

    await expect(page).toHaveURL('/dashboard')
  })

  test('muestra error con credenciales inválidas', async ({ page }) => {
    await page.goto('/login')

    await page.getByLabel('Email').fill('seed@test.com')
    await page.getByLabel('Password').fill('WrongPass1')
    await page.getByRole('button', { name: 'Iniciar sesión' }).click()

    await expect(page.getByRole('alert')).toContainText(/inválid/i)
    await expect(page).toHaveURL('/login')
  })
})

// ── US-05 / US-06: Task flow E2E ─────────────────────────────
test.describe('Flujo de tareas', () => {

  test.beforeEach(async ({ page }) => {
    // Login antes de cada test
    await page.goto('/login')
    await page.getByLabel('Email').fill('seed@test.com')
    await page.getByLabel('Password').fill('Password1')
    await page.getByRole('button', { name: 'Iniciar sesión' }).click()
    await expect(page).toHaveURL('/dashboard')
  })

  test('crear tarea y verificar estado inicial TODO', async ({ page }) => {
    await page.goto('/projects/seed-project')
    await page.getByRole('button', { name: 'Nueva tarea' }).click()

    await page.getByLabel('Título').fill('Mi primera tarea E2E')
    await page.getByLabel('Prioridad').selectOption('HIGH')
    await page.getByRole('button', { name: 'Crear' }).click()

    const task = page.getByText('Mi primera tarea E2E')
    await expect(task).toBeVisible()

    const badge = page.getByTestId('status-badge').first()
    await expect(badge).toContainText('TODO')
  })

  test('mover tarea de TODO a IN_PROGRESS', async ({ page }) => {
    await page.goto('/projects/seed-project')

    const task = page.getByText('Tarea seed para E2E').first()
    await task.click()

    await page.getByRole('button', { name: 'Iniciar' }).click()
    await expect(page.getByTestId('status-badge')).toContainText('IN_PROGRESS')
  })

  test('no puede ir de TODO a DONE directamente', async ({ page }) => {
    await page.goto('/projects/seed-project')

    const task = page.getByText('Tarea seed para E2E').first()
    await task.click()

    // El botón "Completar" no debe existir si la tarea está en TODO
    await expect(page.getByRole('button', { name: 'Completar' })).not.toBeVisible()
  })
})
