import { test, expect } from '@playwright/test'

test('ranking page has season, avatars, ties, paging and secondary board', async ({ page }) => {
  const total = Array.from({ length: 12 }, (_, i) => ({ identityId: i + 1, account: `rank${i + 1}`, avatar: '', totalScore: i < 2 ? 36 : 30 - i }))
  const board = [
    { identityId: 1, account: 'rank1', avatar: '', totalScore: 100, totalScoreText: '100' },
    { identityId: 2, account: 'rank2', avatar: '', totalScore: 100, totalScoreText: '100' },
  ]
  await page.route('**/api/score/user-total-scores*', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, data: total }) }))
  await page.route('**/api/rank/board*', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, data: board }) }))
  await page.goto('http://localhost:5174/login')
  await page.getByPlaceholder('请输入用户名').fill('tester')
  await page.getByPlaceholder('请输入密码').fill('test123456')
  await page.getByRole('button', { name: '登录', exact: true }).click()
  await page.waitForURL('**/home', { timeout: 20_000 })
  await page.goto('http://localhost:5174/ranking')
  await expect(page.getByRole('heading', { name: 'RANK', exact: true })).toBeVisible()
  await expect(page.locator('#ranking-season')).toBeVisible()
  await expect(page.locator('.rank-user img').first()).toBeVisible()
  await expect(page.getByText('rank1', { exact: true }).first()).toBeVisible()
  await expect(page.getByRole('button', { name: '2', exact: true })).toBeVisible()
  await page.getByRole('button', { name: '打榜排行榜', exact: true }).click()
  await expect(page.getByText('打榜排行榜（进行中）', { exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: '查看详细榜单 →', exact: true })).toHaveAttribute('href', '/ranking-new')
})
