import { test, expect } from '@playwright/test'

test('login registration link opens the registration form and submits credentials', async ({ page }) => {
  await page.goto('http://localhost:5174/login')
  await expect(page.getByText('用社团账号进入街机舞台。课题、活动、排行、论坛，都在同一个圆里。')).toHaveCount(0)
  const registerLink = page.locator('.login-card .login-alt').getByRole('link', { name: '立即注册' })
  await expect(registerLink).toBeVisible()
  await registerLink.click()
  await expect(page).toHaveURL(/\/register$/)
  await expect(page.getByRole('heading', { name: '创建账户' })).toBeVisible()

  await page.getByPlaceholder('3-16位用户名').fill('new-member')
  await page.getByPlaceholder('不少于6位').fill('secret123')
  await page.getByPlaceholder('再次输入密码').fill('secret123')
  await page.route('**/api/identity/register', async (route) => {
    expect(route.request().postDataJSON()).toEqual({ account: 'new-member', password: 'secret123' })
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, message: '注册成功', data: null }) })
  })
  await page.getByRole('button', { name: '提交', exact: true }).click()
  await expect(page).toHaveURL(/\/login$/)
})
