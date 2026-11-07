import { test, expect, type Page } from '@playwright/test'

async function loginAdmin(page: Page) {
  await page.goto('http://localhost:5174/login')
  await page.getByPlaceholder('请输入用户名').fill('admin')
  await page.getByPlaceholder('请输入密码').fill('test123456')
  await page.getByRole('button', { name: '登录', exact: true }).click()
  await page.waitForURL('**/home', { timeout: 20_000 })
}

test('admin profile approve/reject/delete sends real requests', async ({ page }) => {
  await page.route('**/api/profile/all', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify([{ id: 10, identityId: 10, account: 'pending-user', avatar: '', description: '待审核签名', title: '新人', status: 0 }]),
  }))
  await page.route('**/api/profile/10', (route) => {
    if (route.request().method() === 'PUT') return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, message: 'ok', data: null }) })
    if (route.request().method() === 'DELETE') return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, message: 'ok', data: null }) })
    return route.continue()
  })
  await loginAdmin(page)
  await page.goto('http://localhost:5174/admin/profiles')
  await expect(page.getByText('pending-user', { exact: true })).toBeVisible()
  await expect(page.getByText('审核中', { exact: true })).toBeVisible()

  const put = page.waitForRequest((r) => r.url().endsWith('/api/profile/10') && r.method() === 'PUT')
  await page.getByRole('button', { name: '通过', exact: true }).click()
  const putRequest = await put
  expect(putRequest.postDataJSON()).toMatchObject({ status: 1 })

  const reject = page.waitForRequest((r) => r.url().endsWith('/api/profile/10') && r.method() === 'PUT')
  await page.getByRole('button', { name: '驳回', exact: true }).click()
  const rejectRequest = await reject
  expect(rejectRequest.postDataJSON()).toMatchObject({ status: -1 })

  page.on('dialog', (dialog) => dialog.accept())
  const del = page.waitForRequest((r) => r.url().endsWith('/api/profile/10') && r.method() === 'DELETE')
  await page.getByRole('button', { name: '删除', exact: true }).click()
  await del
  await expect(page.getByText('用户资料删除成功', { exact: true })).toBeVisible()
})

test('admin content publish uploads image and posts a course', async ({ page }) => {
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=', 'base64')
  await page.route('**/api/course/upload', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, message: 'ok', data: '/images/test.png' }) }))
  await page.route('**/api/course/post', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, message: 'ok', data: null }) }))
  await loginAdmin(page)
  await page.goto('http://localhost:5174/admin/content-publish')
  await page.getByPlaceholder('请输入课题名称').fill('新视觉发布测试')
  await page.locator('input[type="datetime-local"]').nth(0).fill('2026-11-10T10:00')
  await page.locator('input[type="datetime-local"]').nth(1).fill('2026-11-20T10:00')
  await page.getByPlaceholder('请输入课题描述').fill('发布测试描述')
  await page.locator('input[type="file"][accept="image/*"]').first().setInputFiles({ name: 'cover.png', mimeType: 'image/png', buffer: png })
  const post = page.waitForRequest((r) => r.url().endsWith('/api/course/post') && r.method() === 'POST')
  await page.getByRole('button', { name: '提交课题', exact: true }).click()
  const request = await post
  expect(request.postDataJSON()).toMatchObject({ title: '新视觉发布测试', category: 'typical', image: '/images/test.png', description: '发布测试描述' })
  await expect(page.getByText('课题发布成功', { exact: true })).toBeVisible()
})

test('admin score approve and delete send real payloads', async ({ page }) => {
  const row = { id: 1, course: { title: '始与终专题', category: 'typical' }, identity: { account: 'tester' }, uploadTime: '2026-11-03T12:00:00', image: '', remark: '测试成绩', score: null }
  await page.route('**/api/score/unscored-non-bingo*', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ list: [row] }) }))
  await page.route('**/api/score/update/1', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, message: 'ok', data: null }) }))
  await page.route('**/api/score/delete/1', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, message: 'ok', data: null }) }))
  await loginAdmin(page)
  await page.goto('http://localhost:5174/admin/scores')
  await expect(page.getByText('始与终专题', { exact: true })).toBeVisible()
  await page.getByPlaceholder('分数').fill('10')
  const update = page.waitForRequest((r) => r.url().endsWith('/api/score/update/1') && r.method() === 'PUT')
  await page.getByRole('button', { name: '通过', exact: true }).click()
  const updateRequest = await update
  expect(updateRequest.postDataJSON()).toMatchObject({ point: 10, is_scored: true })
  page.on('dialog', (dialog) => dialog.accept())
  const del = page.waitForRequest((r) => r.url().endsWith('/api/score/delete/1') && r.method() === 'DELETE')
  await page.getByRole('button', { name: '删除', exact: true }).click()
  await del
})

test('admin forum moderation sends decision and reason', async ({ page }) => {
  await page.route('**/api/forum/admin/reports*', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, data: { list: [{ id: 1, postId: 1, replyId: null, reportPostId: 1, reporterName: 'tester', reason: 'spam', detail: '', status: 'pending', targetText: '举报目标内容', createdAt: '2026-11-03T12:00:00' }], total: 1 } }) }))
  await page.route('**/api/forum/admin/posts*', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, data: { list: [{ id: 1, title: '待审核帖', authorName: 'tester', status: 'visible', replyCount: 0, createdAt: '2026-11-03T12:00:00' }], total: 1 } }) }))
  await page.route('**/api/forum/admin/post/1/moderate', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, data: null }) }))
  await loginAdmin(page)
  await page.goto('http://localhost:5174/admin/forum')
  await expect(page.getByText('举报目标内容', { exact: true })).toBeVisible()
  page.on('dialog', (dialog) => { if (dialog.type() === 'prompt') void dialog.accept('违规内容') })
  const del = page.waitForRequest((r) => r.url().endsWith('/api/forum/admin/post/1/moderate') && r.method() === 'POST')
  await page.getByRole('button', { name: '删除', exact: true }).click()
  const req = await del
  expect(req.postDataJSON()).toMatchObject({ decision: 'delete', reason: '违规内容' })
  await expect(page.getByText('已删除该内容', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: '全部帖子', exact: true }).click()
  await expect(page.getByText(/待审核帖/).first()).toBeVisible()
  const retain = page.waitForRequest((r) => r.url().endsWith('/api/forum/admin/post/1/moderate') && r.method() === 'POST')
  await page.getByRole('button', { name: '保留', exact: true }).click()
  const retainReq = await retain
  expect(retainReq.postDataJSON()).toMatchObject({ decision: 'retain', reason: '违规内容' })
})

test('admin rank config saves course rules', async ({ page }) => {
  await page.route('**/api/course/', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ id: 95, title: '始与终专题', category: 'ranking' }]) }))
  await page.route('**/api/rank/configs', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, data: [{ id: 1, category: 'ranking', courseId: 95, courseTitle: '始与终专题', countingRules: 10000000 }] }) }))
  await page.route('**/api/rank/config', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, data: null }) }))
  await loginAdmin(page)
  await page.goto('http://localhost:5174/admin/rank-configs')
  await page.locator('select.page-select').nth(1).selectOption('95')
  await expect(page.locator('table')).toContainText('始与终专题')
  await page.locator('input.page-input[type="number"]').fill('10000000')
  const save = page.waitForRequest((r) => r.url().endsWith('/api/rank/config') && r.method() === 'POST')
  await page.getByRole('button', { name: '保存配置', exact: true }).click()
  const request = await save
  expect(request.postDataJSON()).toMatchObject({ courseId: 95, countingRules: 10000000 })
  await expect(page.getByText('保存成功', { exact: true })).toBeVisible()
})

test('admin title review approves and rejects with payload', async ({ page }) => {
  await page.route('**/api/title/admin/pending', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, data: [{ id: 1, identityId: 1, account: 'tester', name: '测试称号', tier: 'normal', status: 'pending', createdAt: '2026-11-03T12:00:00' }] }) }))
  await page.route('**/api/title/admin/definitions', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, data: [] }) }))
  await page.route('**/api/title/admin/awards*', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, data: { list: [], total: 0 } }) }))
  await page.route('**/api/title/admin/review/1', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, data: null }) }))
  await loginAdmin(page)
  await page.goto('http://localhost:5174/admin/titles')
  await expect(page.getByText('tester 申请了', { exact: false })).toBeVisible()
  const approve = page.waitForRequest((r) => r.url().endsWith('/api/title/admin/review/1') && r.method() === 'POST')
  await page.getByRole('button', { name: '通过', exact: true }).click()
  const approveReq = await approve
  expect(approveReq.postDataJSON()).toMatchObject({ approved: true, tier: 'normal' })
  await expect(page.getByText('审核通过', { exact: true })).toBeVisible()
  page.on('dialog', (dialog) => { if (dialog.type() === 'prompt') void dialog.accept('不符合条件') })
  const reject = page.waitForRequest((r) => r.url().endsWith('/api/title/admin/review/1') && r.method() === 'POST')
  await page.getByRole('button', { name: '驳回', exact: true }).click()
  const rejectReq = await reject
  expect(rejectReq.postDataJSON()).toMatchObject({ approved: false, note: '不符合条件' })
})

test('admin title revoke sends request after confirmation', async ({ page }) => {
  await page.route('**/api/title/admin/pending', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, data: [] }) }))
  await page.route('**/api/title/admin/definitions', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, data: [] }) }))
  await page.route('**/api/title/admin/awards*', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, data: { list: [{ id: 5, identityId: 1, account: 'tester', name: '旧称号', tier: 'normal', status: 'approved', grantedAt: '2026-11-03T12:00:00' }], total: 1 } }) }))
  await page.route('**/api/title/admin/revoke/5', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, data: null }) }))
  await loginAdmin(page)
  await page.goto('http://localhost:5174/admin/titles')
  await expect(page.getByText('旧称号', { exact: true })).toBeVisible()
  page.on('dialog', (dialog) => { if (dialog.type() === 'confirm') void dialog.accept() })
  const revoke = page.waitForRequest((r) => r.url().endsWith('/api/title/admin/revoke/5') && r.method() === 'POST')
  await page.getByRole('button', { name: '撤销', exact: true }).click()
  await revoke
  await expect(page.getByText('称号已撤销', { exact: true })).toBeVisible()
})

test('admin title create grants to selected user', async ({ page }) => {
  await page.route('**/api/title/admin/pending', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, data: [] }) }))
  await page.route('**/api/title/admin/definitions', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, data: [] }) }))
  await page.route('**/api/title/admin/awards*', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, data: { list: [], total: 0 } }) }))
  await page.route('**/api/title/admin/users*', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, data: [{ id: 1, account: 'tester' }] }) }))
  await page.route('**/api/title/admin/create', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, data: null }) }))
  await loginAdmin(page)
  await page.goto('http://localhost:5174/admin/titles')
  const picker = page.getByPlaceholder('输入昵称搜索用户').first()
  await picker.fill('tester')
  await expect(page.getByRole('button', { name: /tester.*ID 1/ })).toBeVisible()
  await page.getByRole('button', { name: /tester.*ID 1/ }).click()
  await page.getByPlaceholder('最多32字').fill('新称号')
  await page.getByPlaceholder('称号的获得方式').fill('测试发放')
  await page.getByPlaceholder('本次发放的原因').fill('单元测试')
  const create = page.waitForRequest((r) => r.url().endsWith('/api/title/admin/create') && r.method() === 'POST')
  await page.getByRole('button', { name: '创建并发放', exact: true }).click()
  const request = await create
  expect(request.postDataJSON()).toMatchObject({ identityId: 1, name: '新称号', acquisitionMethod: '测试发放', grantReason: '单元测试' })
  await expect(page.getByText('称号已发放', { exact: true })).toBeVisible()
})

test('admin score logs sends filters and category', async ({ page }) => {
  await page.route('**/api/score/admin/logs*', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ list: [{ id: 1, course: { title: '始与终专题' }, identity: { account: 'tester' }, score: 10, isScored: true, uploadTime: '2026-11-03T12:00:00', remark: '日志' }], total: 1 }) }))
  await loginAdmin(page)
  await page.goto('http://localhost:5174/admin/score-logs')
  await expect(page.getByText('始与终专题', { exact: true })).toBeVisible()
  await page.getByPlaceholder('例如 12').fill('95')
  await page.locator('select.page-select').selectOption('true')
  const query = page.waitForRequest((r) => r.url().includes('/api/score/admin/logs') && r.url().includes('course_id=95') && r.url().includes('is_scored=true'))
  await page.getByRole('button', { name: '查询', exact: true }).click()
  await query
  const bingo = page.waitForRequest((r) => r.url().includes('/api/score/admin/logs') && r.url().includes('category=bingo'))
  await page.getByRole('button', { name: 'Bingo课题', exact: true }).click()
  await bingo
})
