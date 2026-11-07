import { test, expect, type Page } from '@playwright/test'

const VUE = process.env.VUE_URL || 'http://localhost:8081'
const REACT = process.env.REACT_URL || 'http://localhost:5174'

async function login(page: Page, base: string) {
  await page.goto(`${base}/login`)
  await page.getByPlaceholder('请输入用户名').fill('tester')
  await page.getByPlaceholder('请输入密码').fill('test123456')
  await page.getByRole('button', { name: '登录', exact: true }).click()
  await page.waitForURL('**/home', { timeout: 20_000 })
}

test('register structure parity', async ({ page }) => {
  for (const [name, base] of [['vue', VUE], ['react', REACT]] as const) {
    await test.step(name, async () => {
      await page.goto(`${base}/register`)
      await expect(page.getByText('用户名', { exact: true })).toBeVisible()
      await expect(page.getByText('密码', { exact: true })).toBeVisible()
      await expect(page.getByText('确认密码', { exact: true })).toBeVisible()
      await expect(page.getByPlaceholder('3-16位用户名')).toBeVisible()
      await expect(page.getByPlaceholder('不少于6位')).toBeVisible()
      await expect(page.getByPlaceholder('再次输入密码')).toBeVisible()
      await expect(page.getByRole('button', { name: '提交', exact: true })).toBeVisible()
      await expect(page.getByRole('button', { name: '重置', exact: true })).toBeVisible()
    })
  }
})

test('core pages data parity', async ({ page }) => {
  for (const [name, base] of [['vue', VUE], ['react', REACT]] as const) {
    await test.step(name, async () => {
      await login(page, base)
      const checks: [string, string][] = [
        ['/task', '夜航星'],
        ['/activity', '月面 Live 第 12 期'],
        ['/forum', '今日曲目推荐推荐'],
        ['/profile', 'tester'],
        ['/ranking', 'rank1'],
        ['/ranking', '36'],
      ]
      for (const [path, text] of checks) {
        await page.goto(`${base}${path}`)
        await expect(page.locator('body')).toContainText(text, { timeout: 20_000 })
      }
    })
  }
})

test('admin route guard parity', async ({ page }) => {
  for (const [name, base] of [['vue', VUE], ['react', REACT]] as const) {
    await test.step(name, async () => {
      await login(page, base)
      await page.goto(`${base}/admin/users`)
      await page.waitForURL('**/home', { timeout: 15_000 })
      expect(new URL(page.url()).pathname).toBe('/home')
    })
  }
})
