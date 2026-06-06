import { test, expect } from '@playwright/test'

// baseURL is set in playwright.config.ts (PLAYWRIGHT_BASE_URL ?? http://localhost:3000)

test.describe('Auth', () => {
  test('unauthenticated visit to / redirects to /login', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL('/login')
  })

  test('login with wrong credentials shows error message', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'nobody@example.com')
    await page.fill('input[type="password"]', 'wrongpassword123')
    await page.click('button[type="submit"]')
    await expect(page.getByText('Invalid email or password')).toBeVisible()
  })
})
