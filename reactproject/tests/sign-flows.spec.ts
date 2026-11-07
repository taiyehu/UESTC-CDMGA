import { test, expect, type Page } from '@playwright/test'

const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII='

async function login(page: Page, account: string) {
  await page.goto('http://localhost:5174/login')
  await page.getByPlaceholder('请输入用户名').fill(account)
  await page.getByPlaceholder('请输入密码').fill('test123456')
  await page.getByRole('button', { name: '登录', exact: true }).click()
  await page.waitForURL('**/home', { timeout: 20_000 })
}

test('sign check-in success and token stripping', async ({ page }) => {
  await page.route('**/api/sign/checkin', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, message: 'ok', data: { alreadyCheckedIn: false } }) }))
  await login(page, 'tester')
  await page.goto('http://localhost:5174/sign/1?token=test-token')
  await expect(page.getByText('签到成功，已自动获得 10 分！', { exact: true })).toBeVisible({ timeout: 20_000 })
  expect(page.url()).not.toContain('token=')
})

test('sign check-in rejects missing token', async ({ page }) => {
  await login(page, 'tester')
  await page.goto('http://localhost:5174/sign/1')
  await expect(page.getByText('签到码无效，请重新扫描现场二维码', { exact: true })).toBeVisible({ timeout: 20_000 })
})

test('sign display renders rotating QR image', async ({ page }) => {
  await page.route('**/api/sign/qr/1*', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, data: { image: PNG, expiresAt: Date.now() + 30000 } }) }))
  await login(page, 'admin')
  await page.goto('http://localhost:5174/activity/1/sign-display')
  await expect(page.getByAltText('现场签到动态二维码')).toBeVisible({ timeout: 20_000 })
  await expect(page.getByText('现场签到', { exact: true })).toBeVisible()
})

test('scanner page exposes camera fallback and image picker', async ({ page }) => {
  await login(page, 'tester')
  await page.goto('http://localhost:5174/scan')
  await expect(page.getByRole('heading', { name: '扫码签到', exact: true })).toBeVisible({ timeout: 20_000 })
  await expect(page.getByText('拍照或选择图片', { exact: true })).toBeVisible()
  await expect(page.locator('input[type="file"][capture="environment"]')).toHaveCount(1)
})
