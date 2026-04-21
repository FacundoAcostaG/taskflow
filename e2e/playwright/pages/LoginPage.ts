import { Page, expect } from '@playwright/test'
export class LoginPage {
    constructor(private page: Page) { }
    async goto() {
        await this.page.goto('/login')
    }
    async register(email: string, password: string, name: string) {
        await this.page.goto('/register')
        await this.page.getByLabel('Nombre').fill(name)
        await this.page.getByTestId('register-email').fill(email)
        await this.page.getByTestId('register-password').fill(password)
        await this.page.getByRole('button', { name: 'Registrarse' }).click()
    }
    async login(email: string, password: string) {
        await this.goto()
        await this.page.getByTestId('login-email').fill(email)
        await this.page.getByTestId('login-password').fill(password)
        await this.page.getByRole('button', { name: 'Entrar' }).click()
    }
    async expectRedirectToProjects() {
        await expect(this.page).toHaveURL('/projects')
    }
    async expectRedirectToLogin() {
        await expect(this.page).toHaveURL('/login')
    }
    async expectErrorMessage(text: string) {
        await expect(this.page.getByTestId('register-error')).toContainText(text)
    }
}