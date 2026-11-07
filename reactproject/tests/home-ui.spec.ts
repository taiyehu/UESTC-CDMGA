import { test, expect } from '@playwright/test'

const REACT = process.env.REACT_URL || 'http://localhost:5174'

test('home controls are wired', async ({ page }) => {
  await page.goto(`${REACT}/login`)
  await page.getByPlaceholder('请输入用户名').fill('tester')
  await page.getByPlaceholder('请输入密码').fill('test123456')
  await page.getByRole('button', { name: '登录', exact: true }).click()
  await page.waitForURL('**/home', { timeout: 20_000 })

  // tabs really change the disc
  await page.getByRole('button', { name: '活动', exact: true }).click()
  await expect(page.locator('.disc-info h1')).toContainText('月面 Live 第 12 期')
  await page.getByRole('button', { name: '课题', exact: true }).click()
  await expect(page.locator('.disc-info h1')).toContainText('夜航星')

  // card detail links
  const detailLinks = page.getByRole('link', { name: '详情 →' })
  await expect(detailLinks).toHaveCount(2)
  await detailLinks.first().click()
  await page.waitForURL('**/task/1', { timeout: 15_000 })
  await page.goBack()
  await page.getByRole('link', { name: '详情 →' }).nth(1).click()
  await page.waitForURL('**/activity/1', { timeout: 15_000 })
  await page.goBack()

  // forum post link
  await page.getByRole('link', { name: /今日曲目推荐推荐/ }).click()
  await page.waitForURL('**/forum/24', { timeout: 15_000 })
  await page.goBack()

  // quick links
  await page.getByRole('link', { name: '排行', exact: true }).click()
  await page.waitForURL('**/ranking', { timeout: 15_000 })
  await page.goBack()

  // theme toggle
  await page.getByRole('button', { name: '切换主题' }).click()
  await expect(page.locator('html')).toHaveClass(/light/)
  await page.getByRole('button', { name: '切换主题' }).click()
  await expect(page.locator('html')).not.toHaveClass(/light/)
})
