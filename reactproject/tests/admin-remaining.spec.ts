import { test, expect, type Page } from '@playwright/test'

async function loginAdmin(page: Page) {
  await page.goto('http://localhost:5174/login')
  await page.getByPlaceholder('请输入用户名').fill('admin')
  await page.getByPlaceholder('请输入密码').fill('test123456')
  await page.getByRole('button', { name: '登录', exact: true }).click()
  await page.waitForURL('**/home', { timeout: 20_000 })
}

const bingoCourse = { id: 83, title: '音游社3月Bingo活动', category: 'bingo' }

test('bingo submissions approve and reject update scores', async ({ page }) => {
  await page.route('**/api/score/unscored-bingo*', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ code: 0, data: { list: [
      { id: 7, issueId: 3, courseName: 'Bingo', account: 'tester', teamId: 1, uploadTime: '2026-11-03T12:00:00', image: '', remark: '[#3] 通过' },
      { id: 8, issueId: 4, courseName: 'Bingo', account: 'tester', teamId: 1, uploadTime: '2026-11-03T12:00:00', image: '', remark: '[#4] 拒绝' },
    ], total: 2 } }),
  }))
  await page.route('**/api/score/update/7', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, data: null }) }))
  await page.route('**/api/score/update/8', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, data: null }) }))
  await loginAdmin(page)
  await page.goto('http://localhost:5174/admin/bingo-submissions')
  await expect(page.getByText('通过', { exact: true }).first()).toBeVisible()
  const approve = page.waitForRequest((r) => r.url().endsWith('/api/score/update/7') && r.method() === 'PUT')
  await page.getByRole('button', { name: '通过', exact: true }).first().click()
  expect((await approve).postDataJSON()).toMatchObject({ point: 2, is_scored: true, issue_id: 3 })
  const reject = page.waitForRequest((r) => r.url().endsWith('/api/score/update/8') && r.method() === 'PUT')
  await page.getByRole('button', { name: '曲目不对', exact: true }).first().click()
  expect((await reject).postDataJSON()).toMatchObject({ point: -2, is_scored: true, issue_id: 4 })
})

test('passed profiles paginate and filter', async ({ page }) => {
  const rows = Array.from({ length: 7 }, (_, i) => ({ id: i + 1, identityId: i + 1, account: `passed${i + 1}`, status: 1, description: 'ok' }))
  await page.route('**/api/profile/all-passed', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(rows) }))
  await loginAdmin(page)
  await page.goto('http://localhost:5174/admin/profiles-passed')
  await expect(page.getByText('passed1', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: '下一页', exact: true }).click()
  await expect(page.getByText('passed6', { exact: true })).toBeVisible()
  await page.getByPlaceholder('按用户名或用户ID筛选').fill('passed7')
  await expect(page.getByText('passed7', { exact: true })).toBeVisible()
})

test('bingo tips add and delete', async ({ page }) => {
  await page.route('**/api/course/', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, data: [bingoCourse] }) }))
  await page.route('**/api/issue/course/83*', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, data: { list: [{ issueId: 1 }, { issueId: 2 }], total: 2 } }) }))
  await page.route('**/api/team/course/83*', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, data: { list: [{ teamId: 1, members: [{ identityId: 1, account: 'tester' }] }], total: 1 } }) }))
  await page.route('**/api/bingo-tip/course/83*', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, data: { list: [{ id: 11, issueId: 1, teamId: 1, tip: '旧提示', createdAt: '2026-11-03T12:00:00' }], total: 1 } }) }))
  await page.route('**/api/bingo-tip/course/83/create', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, data: null }) }))
  await page.route('**/api/bingo-tip/course/83/tip/11', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, data: null }) }))
  await loginAdmin(page)
  await page.goto('http://localhost:5174/admin/bingo-tips/83')
  await expect(page.getByText('旧提示', { exact: true })).toBeVisible()
  await page.getByPlaceholder('可手动输入，如 #7 或 7').fill('#2')
  await page.getByPlaceholder('可手动输入，如 #3 或 3').fill('#1')
  await page.getByPlaceholder('输入提示内容').fill('新提示')
  const create = page.waitForRequest((r) => r.url().endsWith('/api/bingo-tip/course/83/create') && r.method() === 'POST')
  await page.getByRole('button', { name: '添加提示', exact: true }).click()
  expect((await create).postDataJSON()).toMatchObject({ issue_id: 2, team_id: 1, tip: '新提示' })
  const del = page.waitForRequest((r) => r.url().endsWith('/api/bingo-tip/course/83/tip/11') && r.method() === 'DELETE')
  await page.getByRole('button', { name: '删除', exact: true }).click()
  await del
})

test('issue row saves through upsert', async ({ page }) => {
  await page.route('**/api/course/', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, data: [bingoCourse] }) }))
  await page.route('**/api/issue/course/83*', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, data: { list: [], total: 0 } }) }))
  await page.route('**/api/issue/course/83/upsert', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, data: null }) }))
  await loginAdmin(page)
  await page.goto('http://localhost:5174/admin/issues/83')
  await expect(page.getByRole('button', { name: '保存', exact: true }).first()).toBeVisible()
  const save = page.waitForRequest((r) => r.url().endsWith('/api/issue/course/83/upsert') && r.method() === 'POST')
  await page.getByRole('button', { name: '保存', exact: true }).first().click()
  const req = await save
  expect(req.postDataJSON()).toMatchObject({ issue_id: 1 })
})

test('team row saves member ids', async ({ page }) => {
  await page.route('**/api/course/', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, data: [bingoCourse] }) }))
  await page.route('**/api/team/course/83*', (route) => {
    if (route.request().method() === 'GET') return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, data: { list: [{ teamId: 1, members: [{ identityId: 1, account: 'tester' }] }], total: 1 } }) })
    return route.continue()
  })
  await page.route('**/api/team/course/83/save', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, data: null }) }))
  await loginAdmin(page)
  await page.goto('http://localhost:5174/admin/teams/83')
  await expect(page.getByRole('button', { name: '保存', exact: true }).first()).toBeVisible()
  const save = page.waitForRequest((r) => r.url().endsWith('/api/team/course/83/save') && r.method() === 'POST')
  await page.getByRole('button', { name: '保存', exact: true }).first().click()
  expect((await save).postDataJSON()).toMatchObject({ team_id: 1, member_ids: [1] })
})

test('admin course edit and delete send requests', async ({ page }) => {
  await page.route('**/api/course/allcourse*', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ list: [{ id: 95, title: '旧课题', category: 'typical', startTime: '2026-11-01T00:00:00', endTime: '2026-11-30T00:00:00', description: '旧描述', image: '/x.jpg' }], total: 1 }) }))
  await page.route('**/api/course/update/95', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, data: null }) }))
  await page.route('**/api/course/95', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, data: null }) }))
  await loginAdmin(page)
  await page.goto('http://localhost:5174/admin/courses')
  await page.getByPlaceholder('课题名称').fill('新课题名')
  const save = page.waitForRequest((r) => r.url().endsWith('/api/course/update/95') && r.method() === 'PUT')
  await page.getByRole('button', { name: '保存', exact: true }).first().click()
  expect((await save).postDataJSON()).toMatchObject({ title: '新课题名' })
  page.on('dialog', (dialog) => { if (dialog.type() === 'confirm') void dialog.accept() })
  const del = page.waitForRequest((r) => r.url().endsWith('/api/course/95') && r.method() === 'DELETE')
  await page.getByRole('button', { name: '删除', exact: true }).first().click()
  await del
})

test('admin activity links sign course and deletes', async ({ page }) => {
  await page.route('**/api/activity/list', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ list: [{ id: 13, name: '测试活动', startTime: '2026-11-01T00:00:00', endTime: '2026-11-30T00:00:00' }], total: 1 }) }))
  await page.route('**/api/course/', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ id: 90, title: '签到课题', category: 'sign', isDeleted: false }]) }))
  await page.route('**/api/activity/add-assoc-course', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, data: null }) }))
  await page.route('**/api/activity/13', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, data: null }) }))
  await loginAdmin(page)
  await page.goto('http://localhost:5174/admin/activities')
  await page.locator('select.page-select').selectOption('90')
  const link = page.waitForRequest((r) => r.url().endsWith('/api/activity/add-assoc-course') && r.method() === 'POST')
  await page.getByRole('button', { name: '关联', exact: true }).click()
  expect((await link).postDataJSON()).toMatchObject({ activityId: 13, courseId: 90 })
  page.on('dialog', (dialog) => { if (dialog.type() === 'confirm') void dialog.accept() })
  const del = page.waitForRequest((r) => r.url().endsWith('/api/activity/13') && r.method() === 'DELETE')
  await page.getByRole('button', { name: '删除', exact: true }).click()
  await del
})

test('admin user delete and admin 404 boundary', async ({ page }) => {
  await page.route('**/api/identity/allaccount*', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ list: [{ id: 2, account: 'delete-me', role: 'USER', status: 1 }], total: 1 }) }))
  await page.route('**/api/identity/2', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, data: null }) }))
  await loginAdmin(page)
  await page.goto('http://localhost:5174/admin/users')
  await expect(page.getByText('delete-me', { exact: true })).toBeVisible()
  page.on('dialog', (dialog) => { if (dialog.type() === 'confirm') void dialog.accept() })
  const del = page.waitForRequest((r) => r.url().endsWith('/api/identity/2') && r.method() === 'DELETE')
  await page.getByRole('button', { name: '删除', exact: true }).click()
  await del
  await page.goto('http://localhost:5174/admin/does-not-exist')
  await expect(page.getByText('没有这个后台页面', { exact: true })).toBeVisible()
  await expect(page.getByText('后台页面尚未迁移', { exact: true })).toHaveCount(0)
})

test('admin dashboard exposes every management module', async ({ page }) => {
  await loginAdmin(page)
  await page.goto('http://localhost:5174/admin')
  await expect(page.getByRole('heading', { name: 'ADMIN', exact: true })).toBeVisible()
  await expect(page.locator('.admin-grid a')).toHaveCount(15)
  await expect(page.locator('.admin-left a')).toHaveCount(16)
  await expect(page.locator('.admin-grid a[href="/admin/bingo-submissions"]')).toBeVisible()
  await expect(page.locator('.admin-grid a[href="/admin/profiles"]')).toBeVisible()
  await page.getByRole('link', { name: '用户管理', exact: true }).click()
  await expect(page).toHaveURL(/admin\/users/)
  await expect(page.locator('.admin-left a')).toHaveCount(16)
})
