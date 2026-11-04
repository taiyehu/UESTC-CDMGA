import { test, expect, type Page } from '@playwright/test'

const VUE = process.env.VUE_URL || 'http://localhost:8081'
const REACT = process.env.REACT_URL || 'http://localhost:5174'
const SHOTS = '/home/Ar/UESTC-CDMGA/ref/local/shots'

async function login(page: Page, base: string) {
  await page.goto(`${base}/login`)
  await expect(page.getByText('用户名', { exact: true })).toBeVisible()
  await expect(page.getByText('密码', { exact: true })).toBeVisible()
  await expect(page.getByPlaceholder('请输入用户名')).toBeVisible()
  await expect(page.getByPlaceholder('请输入密码')).toBeVisible()
  await page.getByPlaceholder('请输入用户名').fill('tester')
  await page.getByPlaceholder('请输入密码').fill('test123456')

  const responsePromise = page.waitForResponse(
    (res) => res.url().includes('/api/identity/login') && res.request().method() === 'POST',
  )
  await page.getByRole('button', { name: '登录', exact: true }).click()
  const response = await responsePromise
  expect(response.status()).toBe(200)
  expect(response.request().postDataJSON()).toEqual({ account: 'tester', password: 'test123456' })
  const payload = await response.json()
  expect(payload.code).toBe(0)

  await page.waitForURL('**/home', { timeout: 20_000 })
  const session = await page.evaluate(() => sessionStorage.getItem('userInfo'))
  expect(session).toBeTruthy()
}

test('login structure + session parity', async ({ page }) => {
  for (const [name, base] of [['vue', VUE], ['react', REACT]] as const) {
    await test.step(name, async () => {
      await page.goto(`${base}/login`)
      await expect(page.getByText('用户名', { exact: true })).toBeVisible()
      await expect(page.getByText('密码', { exact: true })).toBeVisible()
      await expect(page.getByRole('button', { name: '登录', exact: true })).toBeVisible()
      await expect(page.getByRole('button', { name: '重置', exact: true })).toBeVisible()
      await expect(page.getByText('立即注册', { exact: true })).toBeVisible()
      await page.screenshot({ path: `${SHOTS}/parity-${name}-login.png`, fullPage: true })

      await page.getByPlaceholder('请输入用户名').fill('tester')
      await page.getByPlaceholder('请输入密码').fill('test123456')
      const responsePromise = page.waitForResponse(
        (res) => res.url().includes('/api/identity/login') && res.request().method() === 'POST',
      )
      await page.getByRole('button', { name: '登录', exact: true }).click()
      const response = await responsePromise
      expect(response.status()).toBe(200)
      const payload = await response.json()
      expect(payload.code).toBe(0)

      await page.waitForURL('**/home', { timeout: 20_000 })
      const session = await page.evaluate(() => sessionStorage.getItem('userInfo'))
      expect(session).toBeTruthy()
      await page.waitForTimeout(1500)
      await page.screenshot({ path: `${SHOTS}/parity-${name}-home.png`, fullPage: true })
    })
  }
})

test('home data parity', async ({ page }) => {
  for (const [name, base] of [['vue', VUE], ['react', REACT]] as const) {
    await test.step(name, async () => {
      await login(page, base)
      const body = page.locator('body')
      await expect(body).toContainText('夜航星', { timeout: 20_000 })
      await expect(body).toContainText(name === 'react' ? '每日群友 · MEMBER' : '每天认识一名群友', { timeout: 20_000 })
      const text = (await body.innerText()).replace(/\s+/g, ' ').trim()
      expect(text.length).toBeGreaterThan(100)
      console.log(`[${name}] home text length=${text.length}`)
    })
  }
})


async function apiSnapshot(browser: import('@playwright/test').Browser, base: string) {
  const context = await browser.newContext()
  const page = await context.newPage()
  const coursePromise = page.waitForResponse(
    (res) => res.url().includes('/api/course/standalone') && res.status() === 200,
  )
  const activityPromise = page.waitForResponse(
    (res) => res.url().includes('/api/activity/list') && res.status() === 200,
  )
  await login(page, base)
  const [courseRes, activityRes] = await Promise.all([coursePromise, activityPromise])
  const [courses, activities] = await Promise.all([courseRes.json(), activityRes.json()])
  await context.close()
  return { courses, activities }
}

test('home API payload parity', async ({ browser }) => {
  const vue = await apiSnapshot(browser, VUE)
  const react = await apiSnapshot(browser, REACT)
  expect(react.courses).toEqual(vue.courses)
  expect(react.activities).toEqual(vue.activities)
})
