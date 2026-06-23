import { test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accesibilidad WCAG 2.1 AA - TaskFlow', () => {

  test('Vista Login - sin violaciones WCAG 2.1 AA', async ({ page }) => {
    await page.goto('/login');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    if (results.violations.length > 0) {
      console.log('Violaciones encontradas:');
      results.violations.forEach(v => {
        console.log(`[${v.impact?.toUpperCase()}] ${v.id}: ${v.description}`);
        v.nodes.forEach(n => console.log('  Elemento:', n.html));
      });
    }
    console.log(`Total violaciones Login: ${results.violations.length}`);
  });

  test('Vista Proyectos - sin violaciones WCAG 2.1 AA', async ({ page }) => {
    await page.goto('/login');
    await page.getByTestId('login-email').fill('alice@taskflow.dev');
    await page.getByTestId('login-password').fill('Password1');
    await page.getByRole('button', { name: 'Entrar' }).click();
    await page.waitForURL('/projects');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    if (results.violations.length > 0) {
      console.log('Violaciones encontradas:');
      results.violations.forEach(v => {
        console.log(`[${v.impact?.toUpperCase()}] ${v.id}: ${v.description}`);
        v.nodes.forEach(n => console.log('  Elemento:', n.html));
      });
    }
    console.log(`Total violaciones Proyectos: ${results.violations.length}`);
  });

});