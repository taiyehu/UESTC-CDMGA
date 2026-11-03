import { test, expect } from '@playwright/test'

const REACT = process.env.REACT_URL || 'http://localhost:5174'

test('admin pages mount with admin session', async ({ page }) => {
  await page.goto(`${REACT}/login`)
  await page.getByPlaceholder('请输入用户名').fill('admin')
  await page.getByPlaceholder('请输入密码').fill('test123456')
  await page.getByRole('button', { name: '登录', exact: true }).click()
  await page.waitForURL('**/home', { timeout: 20_000 })

  const pages: [string, string][] = [
    ['/admin/users', 'ADMIN · USERS'],
    ['/admin/courses', 'ADMIN · COURSES'],
    ['/admin/content-publish', 'ADMIN · CONTENT'],
    ['/admin/activities', 'ADMIN · ACTIVITIES'],
    ['/admin/forum', 'ADMIN · FORUM'],
    ['/admin/profiles', 'ADMIN · PROFILES'],
    ['/admin/profiles-passed', 'ADMIN · PASSED'],
    ['/admin/titles', 'ADMIN · TITLES'],
    ['/admin/bingo-submissions', 'ADMIN · BINGO'],
    ['/admin/scores', 'ADMIN · SCORES'],
    ['/admin/rank-configs', 'ADMIN · RANK CONFIG'],
    ['/admin/score-logs', 'ADMIN · SCORE LOGS'],
  ]

  const pageErrors: string[] = []
  page.on('pageerror', (err) => pageErrors.push(err.message))

  for (const [path, title] of pages) {
    await page.goto(`${REACT}${path}`)
    await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible({ timeout: 20_000 })
    await page.waitForTimeout(600)
  }

  await page.goto(`${REACT}/admin/users`)
  await expect(page.locator('body')).toContainText('tester', { timeout: 20_000 })
  await page.goto(`${REACT}/admin/courses`)
  await expect(page.locator('table input').first()).toHaveValue('夜航星', { timeout: 20_000 })
  await page.goto(`${REACT}/admin/forum`)
  await page.getByRole('button', { name: '全部帖子', exact: true }).click()
  await expect(page.locator('body')).toContainText('本地测试帖：UI 对照', { timeout: 20_000 })
  await page.goto(`${REACT}/admin/activities`)
  await expect(page.locator('body')).toContainText('月面 Live 第 12 期', { timeout: 20_000 })

  expect(pageErrors, pageErrors.join('\n')).toEqual([])
})
