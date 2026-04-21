import { test, expect } from '@playwright/test'
import { LoginPage } from '../pages/LoginPage'
import { ProjectListPage } from '../pages/ProjectListPage'
test.describe('US-03: Crear proyecto', () => {
    test.beforeEach(async ({ page }) => {
        const loginPage = new LoginPage(page)
        const email = `user_${Date.now()}@test.com`
        const password = 'Password123'
        await loginPage.register(email, password, 'Test User')
        await loginPage.expectRedirectToLogin()
        await loginPage.login(email, password)
        await loginPage.expectRedirectToProjects()
    })
    test('crear proyecto aparece en la lista', async ({ page }) => {
        const projectsPage = new ProjectListPage(page)
        await projectsPage.goto()
        await projectsPage.createProject('Mi primer proyecto')
        await projectsPage.expectProjectVisible('Mi primer proyecto')
    })
    test('nombre vacío no crea el proyecto', async ({ page }) => {
        const projectsPage = new ProjectListPage(page)
        await projectsPage.goto()
        await projectsPage.createProject('')
        // El browser bloquea el submit por el atributo required — el formulario queda abierto
        await projectsPage.expectFormVisible()
        await projectsPage.expectProjectCount(0)
    })
})