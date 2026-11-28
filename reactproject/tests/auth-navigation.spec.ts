import { expect, test } from '@playwright/test'

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

const user = { id: 35, account: 'tester', role: 'admin' }

test('protected navigation reuses the verified session', async ({ page }) => {
  let checks = 0
  await page.route('**/api/**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, data: [], list: [] }) }))
  await page.route('**/api/identity/me', async (route) => {
    checks += 1
    await new Promise((resolve) => setTimeout(resolve, 250))
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, data: user }) })
  })

  await page.goto('http://localhost:5174/links')
  await expect(page.getByRole('heading', { name: '正在进入页面' })).toBeVisible()
  await expect(page.getByRole('navigation', { name: '主导航' }).getByRole('link', { name: '链接' })).toBeVisible()
  const initialChecks = checks

  await page.getByRole('navigation', { name: '主导航' }).getByRole('link', { name: '课题' }).click()
  await expect(page).toHaveURL(/\/task$/)
  await page.getByRole('navigation', { name: '主导航' }).getByRole('link', { name: '活动' }).click()
  await expect(page).toHaveURL(/\/activity$/)
  await page.getByRole('button', { name: '打开用户菜单' }).click()
  await page.getByRole('link', { name: '管理', exact: true }).click()
  await expect(page).toHaveURL(/\/admin$/)
  expect(checks).toBe(initialChecks)
})

test('temporary verification failure keeps the local session and offers retry', async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('userInfo', JSON.stringify({ id: 35, role: 'admin' })))
  let allowVerification = false
  await page.route('**/api/**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }))
  await page.route('**/api/identity/me', (route) => {
    return route.fulfill({
      status: allowVerification ? 200 : 503,
      contentType: 'application/json',
      body: allowVerification ? JSON.stringify({ code: 0, data: user }) : '{}',
    })
  })

  await page.goto('http://localhost:5174/links')
  await expect(page.getByRole('heading', { name: '暂时无法验证登录状态' })).toBeVisible()
  expect(await page.evaluate(() => sessionStorage.getItem('userInfo'))).not.toBeNull()
  allowVerification = true
  await page.getByRole('button', { name: '重试' }).click()
  await expect(page.getByRole('navigation', { name: '主导航' }).getByRole('link', { name: '链接' })).toBeVisible()
})

test('expired session still redirects to login', async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('userInfo', JSON.stringify(user)))
  await page.route('**/api/identity/me', (route) => route.fulfill({ status: 401, contentType: 'application/json', body: '{}' }))

  await page.goto('http://localhost:5174/links')
  await expect(page).toHaveURL(/\/login$/)
  expect(await page.evaluate(() => sessionStorage.getItem('userInfo'))).toBeNull()
})
