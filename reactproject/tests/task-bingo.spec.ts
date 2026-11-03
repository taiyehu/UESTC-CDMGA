import { test, expect } from '@playwright/test'

test('bingo board renders 25 selectable cells', async ({ page }) => {
  await page.goto('http://localhost:5174/login')
  await page.getByPlaceholder('请输入用户名').fill('tester')
  await page.getByPlaceholder('请输入密码').fill('test123456')
  await page.getByRole('button', { name: '登录', exact: true }).click()
  await page.waitForURL('**/home', { timeout: 20_000 })
  await page.goto('http://localhost:5174/task/83/bingo/1')
  await expect(page.locator('button[title^="第 "]')).toHaveCount(25, { timeout: 20_000 })
  await page.locator('button[title="第 2 题"]').click()
  await expect(page.locator('button[title="第 2 题"]')).toBeVisible()
})

test('bingo task detail redirects to the full bingo workspace', async ({ page }) => {
  await page.goto('http://localhost:5174/login')
  await page.getByPlaceholder('请输入用户名').fill('tester')
  await page.getByPlaceholder('请输入密码').fill('test123456')
  await page.getByRole('button', { name: '登录', exact: true }).click()
  await page.waitForURL('**/home', { timeout: 20_000 })
  await page.goto('http://localhost:5174/task/83')
  await page.waitForURL('**/task/83/bingo/1', { timeout: 20_000 })
  await expect(page.locator('button[title^="第 "]')).toHaveCount(25)
})
