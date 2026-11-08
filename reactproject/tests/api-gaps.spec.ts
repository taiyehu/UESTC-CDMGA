import { test, expect } from '@playwright/test'

async function login(page: import('@playwright/test').Page, account: string) {
  await page.goto('http://localhost:5174/login')
  await page.getByPlaceholder('请输入用户名').fill(account)
  await page.getByPlaceholder('请输入密码').fill('test123456')
  await page.getByRole('button', { name: '登录', exact: true }).click()
  await page.waitForURL('**/home', { timeout: 20_000 })
}

test('profile fills rated activities, school and redemptions', async ({ page }) => {
  await page.route('**/api/profile/identity/1', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, data: { id: 1, account: 'tester', status: 1, avatar: '' } }) }))
  await page.route('**/api/identity/online/1', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, data: true }) }))
  await page.route('**/api/score/user-course-scores*', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, data: [] }) }))
  await page.route('**/title/mine*', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, data: [] }) }))
  await page.route('**/api/activity/rated-activities/1', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ id: 1, name: '评分活动', startTime: '2026-11-01T10:00:00' }]) }))
  await page.route('**/api/score/user-award-redemptions*', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, data: [{ id: 1, course: { title: '兑换奖品' }, score: -100, uploadTime: '2026-11-02T10:00:00' }] }) }))
  await page.route('**/api/identity-extra-profile/user/1/school', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ university: 'UESTC' }) }))
  await login(page, 'tester')
  await page.goto('http://localhost:5174/profile/1')
  await expect(page.getByText('评分活动', { exact: true })).toBeVisible({ timeout: 20_000 })
  await expect(page.getByText('兑换奖品', { exact: true })).toBeVisible()
  await expect(page.getByText('电子科技大学', { exact: true })).toBeVisible()
  await expect(page.locator('.profile-presence-dot.online')).toBeVisible()
  await page.unroute('**/api/identity/online/1')
  await page.route('**/api/identity/online/1', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, data: false }) }))
  await page.reload()
  await expect(page.getByText('离线', { exact: true })).toBeVisible()
  await expect(page.locator('.profile-presence-dot.offline')).toHaveCSS('background-color', 'rgb(146, 153, 165)')
})

test('bingo detail calls bingo-issue history and dashboard calls accounts', async ({ page }) => {
  await page.route('**/api/course/83', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, data: { id: 83, title: 'Bingo', category: 'bingo', startTime: '2026-03-01T00:00:00', endTime: '2026-03-30T00:00:00', description: '' } }) }))
  await page.route('**/api/issue/course/83*', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ list: [] }) }))
  await page.route('**/api/bingo-tip/course/83*', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, data: { list: [] } }) }))
  await page.route('**/api/team/course/83*', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, data: null }) }))
  const history = page.waitForRequest((r) => r.url().includes('/api/score/history/bingo-issue'))
  await login(page, 'tester')
  await page.goto('http://localhost:5174/task/83/bingo/11')
  await history
  await page.goto('http://localhost:5174/login')
  await page.getByPlaceholder('请输入用户名').fill('admin')
  await page.getByPlaceholder('请输入密码').fill('test123456')
  await page.getByRole('button', { name: '登录', exact: true }).click()
  await page.waitForURL('**/home', { timeout: 20_000 })
  await page.route('**/api/identity/allaccount*', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ list: [], total: 42 }) }))
  await page.goto('http://localhost:5174/admin')
  await expect(page.getByText('注册用户：42', { exact: true })).toBeVisible()
})
