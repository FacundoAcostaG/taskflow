import { Page, expect } from 'playwright/test'
export class ProjectListPage {
    constructor(private page: Page) { }
    async goto() {
        await this.page.goto('/projects')
    }
    async createProject(name: string) {
        await this.page.getByTestId('create-project-btn').click()
        await this.page.getByTestId('project-name-input').fill(name)
        await this.page.getByTestId('project-submit').click()
    }
    async expectFormVisible() {
        await expect(this.page.getByTestId('project-name-input')).toBeVisible()
    }
    async expectProjectVisible(name: string) {
        await expect(this.page.getByText(name)
        ).toBeVisible()
    }
    async expectProjectCount(count: number) {
        await expect(
            this.page.getByTestId('project-card')
        ).toHaveCount(count)
    }
}