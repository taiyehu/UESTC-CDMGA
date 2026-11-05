import { test, expect } from '@playwright/test'

test('mobile bottom navigation routes between pages', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.addInitScript(() => { sessionStorage.setItem('userInfo', JSON.stringify({ id: 1, account: 'tester' })); sessionStorage.setItem('role', '"user"') })
  await page.goto('http://localhost:5174/home')
  const tab = page.locator('.mobile-tab')
  await expect(tab).toBeVisible()
  await expect(page.locator('.page-nav')).toBeHidden()
  await tab.getByRole('link', { name: '论坛', exact: true }).click()
  await expect(page).toHaveURL(/\/forum$/)
  await expect(page.locator('.mobile-tab')).toBeVisible()
  await expect(page.locator('.page-nav')).toBeHidden()
  await page.locator('.mobile-tab').getByRole('link', { name: '首页', exact: true }).click()
  await expect(page).toHaveURL(/\/home$/)
  await page.locator('.mobile-tab').getByRole('link', { name: '扫码', exact: true }).click()
  await expect(page).toHaveURL(/\/scan$/)
  await expect(page.getByRole('heading', { name: '扫码签到', exact: true })).toBeVisible()
})

test('1080 portrait uses the same bottom navigation', async ({ page }) => {
  await page.setViewportSize({ width: 1080, height: 1920 })
  await page.addInitScript(() => { sessionStorage.setItem('userInfo', JSON.stringify({ id: 1, account: 'tester' })); sessionStorage.setItem('role', '"user"') })
  await page.goto('http://localhost:5174/home')
  await expect(page.locator('.mobile-tab')).toBeVisible()
  await page.locator('.mobile-tab').getByRole('link', { name: '论坛', exact: true }).click()
  await expect(page).toHaveURL(/\/forum$/)
  await expect(page.locator('.mobile-tab')).toBeVisible()
})
