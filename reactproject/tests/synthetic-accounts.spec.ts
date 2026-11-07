import { test, expect } from '@playwright/test'

const base = 'http://localhost:5174'
const password = process.env.DSH_SYNTHETIC_ACCOUNT_PASSWORD

for (const [name, viewport] of [
  ['desktop', { width: 1440, height: 900 }],
  ['mobile', { width: 390, height: 844 }],
] as const) {
  test(`${name}: generated accounts preserve public scores and admin guards`, async ({ page }) => {
    test.skip(!password, 'Requires the generated local synthetic database and local backend')
    await page.setViewportSize(viewport)
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    await page.goto(`${base}/admin/users`)
    await expect(page).toHaveURL(`${base}/login`)
    await page.getByPlaceholder('请输入用户名').fill('synthetic_member')
    await page.getByPlaceholder('请输入密码').fill(password!)
    await page.getByRole('button', { name: '登录', exact: true }).click()
    await expect(page).toHaveURL(`${base}/home`)

    await page.goto(`${base}/profile/3`)
    await expect(page.getByRole('heading', { name: 'synthetic_user_3', exact: true })).toBeVisible()
    await expect(page.getByRole('cell', { name: 'Synthetic course 1', exact: true })).toBeVisible()
    await expect(page.getByRole('cell', { name: '17', exact: true })).toBeVisible()
    await expect(page.getByRole('cell', { name: '999', exact: true })).toHaveCount(0)
    await page.evaluate(() => {
      sessionStorage.setItem('role', JSON.stringify('admin'))
      sessionStorage.setItem('userInfo', JSON.stringify({ id: 1, account: 'synthetic_admin', role: 'admin' }))
    })
    await page.goto(`${base}/admin/users`)
    await expect(page).toHaveURL(`${base}/home`)

    await page.context().clearCookies()
    await page.goto(`${base}/login`)
    await page.getByPlaceholder('请输入用户名').fill('synthetic_admin')
    await page.getByPlaceholder('请输入密码').fill(password!)
    await page.getByRole('button', { name: '登录', exact: true }).click()
    await expect(page).toHaveURL(`${base}/home`)
    await page.goto(`${base}/admin/users`)
    await expect(page.getByRole('heading', { name: 'ADMIN · USERS', exact: true })).toBeVisible()
    await expect(page.getByRole('cell', { name: 'synthetic_member', exact: true })).toBeVisible()
    expect(errors).toEqual([])
  })
}
