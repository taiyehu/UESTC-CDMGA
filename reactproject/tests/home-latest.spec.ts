import { test, expect } from '@playwright/test'

test('home chooses the newest course and activity', async ({ page }) => {
  await page.route('**/api/course/standalone', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([
    { id: 1, title: '旧课题', category: 'typical', startTime: '2025-01-01T00:00:00', endTime: '2025-01-31T00:00:00', description: '', image: '' },
    { id: 2, title: '最新课题', category: 'typical', startTime: '2026-10-01T00:00:00', endTime: '2026-10-31T00:00:00', description: '', image: '' },
  ]) }))
  await page.route('**/api/activity/list', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ list: [
    { id: 1, name: '旧活动', startTime: '2025-01-01T00:00:00', endTime: '2025-01-02T00:00:00' },
    { id: 2, name: '最新活动', startTime: '2026-10-01T00:00:00', endTime: '2026-10-02T00:00:00' },
  ] }) }))
  await page.route('**/api/profile/daily*', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'null' }))
  await page.route('**/api/checkin/today*', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: 'null' }))
  await page.goto('http://localhost:5174/home')
  await expect(page.getByText('最新课题', { exact: true }).first()).toBeVisible()
  await page.getByRole('button', { name: '活动', exact: true }).click()
  await expect(page.getByText('最新活动', { exact: true }).first()).toBeVisible()
})
