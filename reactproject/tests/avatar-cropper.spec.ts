import { test, expect } from '@playwright/test'

const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=', 'base64')

test('avatar cropper opens and exposes controls', async ({ page }) => {
  await page.goto('http://localhost:5174/login')
  await page.getByPlaceholder('请输入用户名').fill('tester')
  await page.getByPlaceholder('请输入密码').fill('test123456')
  await page.getByRole('button', { name: '登录', exact: true }).click()
  await page.waitForURL('**/home', { timeout: 20_000 })
  await page.goto('http://localhost:5174/profile-setting')
  await expect(page.getByText('编辑个人信息', { exact: true })).toBeVisible()
  const file = page.locator('input[type="file"]').first()
  await file.setInputFiles({ name: 'avatar.png', mimeType: 'image/png', buffer: PNG })
  const dialog = page.getByRole('dialog', { name: '裁剪头像' })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('button', { name: '放大', exact: true })).toBeVisible()
  await expect(dialog.getByRole('button', { name: '缩小', exact: true })).toBeVisible()
  await expect(dialog.getByRole('button', { name: '左旋', exact: true })).toBeVisible()
  await expect(dialog.getByRole('button', { name: '右旋', exact: true })).toBeVisible()
  await expect(dialog.getByRole('button', { name: '确定裁剪', exact: true })).toBeVisible()
  await dialog.getByRole('button', { name: '取消', exact: true }).click()
  await expect(dialog).toBeHidden()
})
