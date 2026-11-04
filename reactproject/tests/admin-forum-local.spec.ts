import { test, expect } from '@playwright/test'

test('admin forum loads local database data', async ({ page }) => {
  await page.goto('http://localhost:5174/login')
  await page.getByPlaceholder('请输入用户名').fill('admin')
  await page.getByPlaceholder('请输入密码').fill('test123456')
  await page.getByRole('button', { name: '登录', exact: true }).click()
  await page.waitForURL('**/home', { timeout: 20_000 })
  await page.goto('http://localhost:5174/admin/forum')
  await expect(page.locator('body')).not.toContainText('请重新登录', { timeout: 20_000 })
  await page.getByRole('button', { name: '全部帖子', exact: true }).click()
  await expect(page.getByText(/今日曲目推荐推荐/)).toBeVisible({ timeout: 20_000 })
})
