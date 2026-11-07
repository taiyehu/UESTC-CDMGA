import { test, expect } from '@playwright/test'

test('admin forum loads local database data', async ({ page }) => {
  test.skip(!process.env.DSH_SYNTHETIC_ACCOUNT_PASSWORD, 'Run against the generated local synthetic database')
  await page.goto('http://localhost:5174/login')
  await page.getByPlaceholder('请输入用户名').fill('synthetic_admin')
  await page.getByPlaceholder('请输入密码').fill(process.env.DSH_SYNTHETIC_ACCOUNT_PASSWORD!)
  await page.getByRole('button', { name: '登录', exact: true }).click()
  await page.waitForURL('**/home', { timeout: 20_000 })
  await page.goto('http://localhost:5174/admin/forum')
  await expect(page.locator('body')).not.toContainText('请重新登录', { timeout: 20_000 })
  await page.getByRole('button', { name: '全部帖子', exact: true }).click()
  await expect(page.getByRole('link', { name: '#23 Synthetic post 23', exact: true })).toBeVisible({ timeout: 20_000 })
})
