import { test, expect } from '@playwright/test'

const post = {
  id: 1,
  authorId: 1,
  authorName: 'tester',
  title: '本地测试帖：UI 对照',
  content: '正文内容',
  status: 'visible',
  createdAt: '2026-11-03T21:19:00',
  likeCount: 0,
  replyCount: 0,
  liked: false,
  images: [],
  files: [],
  replies: [],
}

test('own forum post can be edited and deleted', async ({ page }) => {
  await page.route('**/api/forum/posts/1*', (route) => {
    if (route.request().method() === 'GET') return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, message: 'ok', data: post }) })
    if (route.request().method() === 'PATCH') return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, message: 'ok', data: null }) })
    return route.continue()
  })
  await page.route('**/api/forum/post/1', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, message: 'ok', data: null }) }))
  await page.goto('http://localhost:5174/login')
  await page.getByPlaceholder('请输入用户名').fill('tester')
  await page.getByPlaceholder('请输入密码').fill('test123456')
  await page.getByRole('button', { name: '登录', exact: true }).click()
  await page.waitForURL('**/home', { timeout: 20_000 })
  await page.goto('http://localhost:5174/forum/1')
  await expect(page.getByRole('button', { name: '编辑', exact: true })).toBeVisible()
  await page.getByRole('button', { name: '编辑', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: '编辑帖子' })
  await expect(dialog).toBeVisible()
  const title = dialog.locator('input.page-input')
  await title.fill('编辑后的标题')
  const patch = page.waitForRequest((r) => r.url().endsWith('/api/forum/posts/1') && r.method() === 'PATCH')
  await dialog.getByRole('button', { name: '保存', exact: true }).click()
  const request = await patch
  expect(request.postDataJSON()).toMatchObject({ title: '编辑后的标题' })
  await expect(page.getByText('帖子已更新', { exact: true })).toBeVisible()
  page.on('dialog', (d) => d.accept())
  const del = page.waitForRequest((r) => r.url().endsWith('/api/forum/post/1') && r.method() === 'DELETE')
  await page.getByRole('button', { name: '删除', exact: true }).click()
  await del
  await page.waitForURL('**/forum', { timeout: 20_000 })
})

test('reply like, report and delete are wired', async ({ page }) => {
  const data = {
    ...post,
    replies: [{ id: 10, authorId: 1, authorName: 'tester', content: '回复内容', createdAt: '2026-11-03T12:00:00', likeCount: 0, liked: false }],
  }
  await page.route('**/api/forum/posts/1*', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, message: 'ok', data }) }))
  await page.route('**/api/forum/reply/10/like', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, data: { liked: true } }) }))
  await page.route('**/api/forum/reply/10/report', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, data: null }) }))
  await page.route('**/api/forum/reply/10', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: 0, data: null }) }))
  await page.goto('http://localhost:5174/login')
  await page.getByPlaceholder('请输入用户名').fill('tester')
  await page.getByPlaceholder('请输入密码').fill('test123456')
  await page.getByRole('button', { name: '登录', exact: true }).click()
  await page.waitForURL('**/home', { timeout: 20_000 })
  await page.goto('http://localhost:5174/forum/1')
  const reply = page.locator('.forum-list .forum-row').first()
  await expect(reply).toContainText('回复内容')
  await reply.locator('button').filter({ hasText: '点赞' }).click()
  await expect(reply.locator('button').filter({ hasText: '1 点赞' })).toBeVisible()
  page.on('dialog', (dialog) => { if (dialog.type() === 'prompt') void dialog.accept('不当内容') })
  await reply.getByRole('button', { name: '举报', exact: true }).click()
  page.on('dialog', (dialog) => { if (dialog.type() === 'confirm') void dialog.accept() })
  const del = page.waitForRequest((r) => r.url().endsWith('/api/forum/reply/10') && r.method() === 'DELETE')
  await reply.getByRole('button', { name: '删除', exact: true }).click()
  await del
  await expect(page.getByText('回复已删除', { exact: true })).toBeVisible()
})
