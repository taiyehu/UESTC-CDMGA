import { test, expect, type Page } from '@playwright/test'

const board = {
  code: 0,
  message: 'ok',
  data: [{
    identityId: 4,
    account: 'rank1',
    totalScore: 36,
    totalScoreText: '36',
    submissions: [{ scoreId: 1, courseId: 95, courseTitle: '始与终专题', displayScore: 36, displayScoreText: '36', image: '', uploadTime: '2026-11-03T12:00:00' }],
  }],
}

async function login(page: Page) {
  await page.goto('http://localhost:5174/login')
  await page.getByPlaceholder('请输入用户名').fill('tester')
  await page.getByPlaceholder('请输入密码').fill('test123456')
  await page.getByRole('button', { name: '登录', exact: true }).click()
  await page.waitForURL('**/home', { timeout: 20_000 })
}

test('ranking-new history and expanded submissions', async ({ page }) => {
  await page.route('**/api/rank/board*', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(board) }))
  await page.route('**/api/rank/courses*', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, data: [{ id: 95, title: '始与终专题', startTime: '2026-10-26T00:00:00', endTime: '2026-11-09T00:00:00' }] }) }))
  await page.route('**/api/course/availablecourse-containing*', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ list: [{ id: 95, title: '始与终专题', description: '进行中' }] }) }))
  await login(page)
  await page.goto('http://localhost:5174/ranking-new')
  await expect(page.getByRole('heading', { name: 'RANKING', exact: true })).toBeVisible()
  await expect(page.getByText('rank1', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: '展开', exact: true }).click()
  await expect(page.getByText('始与终专题', { exact: true }).first()).toBeVisible()
  await page.getByRole('button', { name: '历史', exact: true }).click()
  await expect(page.getByText('历史课题：', { exact: true })).toBeVisible()
  await expect(page.locator('select.page-select')).toHaveCount(1)
  await page.getByRole('button', { name: '比赛成绩记录', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'RANKING', exact: true })).toBeVisible()
})

test('contest ranking expands submissions', async ({ page }) => {
  await page.route('**/api/rank/board*', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(board) }))
  await login(page)
  await page.goto('http://localhost:5174/contest-ranking')
  await expect(page.getByText('rank1', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: '展开', exact: true }).click()
  await expect(page.getByText('始与终专题', { exact: true })).toBeVisible()
})
