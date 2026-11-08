import { test, expect, type Page } from '@playwright/test'

async function login(page: Page) {
  await page.goto('http://localhost:5174/login')
  await page.getByPlaceholder('请输入用户名').fill('tester')
  await page.getByPlaceholder('请输入密码').fill('test123456')
  await page.getByRole('button', { name: '登录', exact: true }).click()
  await page.waitForURL('**/home', { timeout: 20_000 })
}

test('task detail invalid and missing ids show boundary states', async ({ page }) => {
  await login(page)
  await page.goto('http://localhost:5174/task/abc')
  await expect(page.getByText('课题编号无效', { exact: true })).toBeVisible({ timeout: 20_000 })
  await page.goto('http://localhost:5174/task/999999')
  await expect(page.getByText('课题不存在', { exact: true })).toBeVisible({ timeout: 20_000 })
})

test('activity detail invalid and missing ids show boundary states', async ({ page }) => {
  await login(page)
  await page.goto('http://localhost:5174/activity/abc')
  await expect(page.getByText('活动编号无效', { exact: true })).toBeVisible({ timeout: 20_000 })
  await page.goto('http://localhost:5174/activity/999999')
  await expect(page.getByText('活动不存在', { exact: true })).toBeVisible({ timeout: 20_000 })
})

test('typical course renders issue-derived subtask cards', async ({ page }) => {
  await page.route('**/api/course/95', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, data: { id: 95, title: 'Typical 测试', category: 'typical', startTime: '2026-11-01T00:00:00', endTime: '2026-11-30T00:00:00', description: JSON.stringify({ typicalItems: [{ id: 1, title: '子题一', description: '默认描述' }, { id: 2, title: '子题二', description: '默认二' }] }), image: '' } }) }))
  await page.route('**/api/issue/course/95*', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ list: [{ issueId: 1, songName: '测试曲目', difficulty: '困难', text: '来自 issue 的说明', file: '/files/test.mp3' }] }) }))
  await page.route('**/api/score/exists*', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: 'false' }))
  await page.route('**/api/score/history*', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ list: [] }) }))
  await login(page)
  await page.goto('http://localhost:5174/task/95')
  await expect(page.getByText('#1 测试曲目', { exact: true })).toBeVisible({ timeout: 20_000 })
  await expect(page.getByText('来自 issue 的说明', { exact: true })).toBeVisible()
  await expect(page.locator('.subtask-card').first().getByText('难度：困难', { exact: true })).toBeVisible()
  await expect(page.getByText('#2 子题二', { exact: true })).toBeVisible()
  await expect(page.locator('audio')).toHaveCount(1)
})
