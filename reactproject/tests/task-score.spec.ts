import { test, expect } from '@playwright/test'

test('task score submission dialog is wired', async ({ page }) => {
  await page.goto('http://localhost:5174/login')
  await page.getByPlaceholder('请输入用户名').fill('tester')
  await page.getByPlaceholder('请输入密码').fill('test123456')
  await page.getByRole('button', { name: '登录', exact: true }).click()
  await page.waitForURL('**/home', { timeout: 20_000 })
  await page.goto('http://localhost:5174/task/95')
  await expect(page.getByRole('heading', { name: 'TASK DETAIL', exact: true })).toBeVisible()
  await page.getByRole('button', { name: '提交成绩', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: '提交成绩' })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByText('成绩图片', { exact: true })).toBeVisible()
  await expect(dialog.getByText('补充说明', { exact: true })).toBeVisible()
  await expect(dialog.getByRole('button', { name: '确认提交' })).toBeVisible()
  await dialog.getByRole('button', { name: '取消' }).click()
  await expect(dialog).toBeHidden()
})

test('existing score history exposes update flow', async ({ page }) => {
  await page.route('**/api/score/exists*', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: 'true' }))
  await page.route('**/api/score/history*', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ teamId: null, hasTeam: true, list: [{ id: 9, uploadTime: '2026-11-03T12:00:00', image: '', remark: '旧备注', isScored: true, score: 10 }] }),
  }))
  await page.goto('http://localhost:5174/login')
  await page.getByPlaceholder('请输入用户名').fill('tester')
  await page.getByPlaceholder('请输入密码').fill('test123456')
  await page.getByRole('button', { name: '登录', exact: true }).click()
  await page.waitForURL('**/home', { timeout: 20_000 })
  await page.goto('http://localhost:5174/task/95')
  await expect(page.getByText('我的提交', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: '更新成绩', exact: true })).toBeVisible()
  await page.getByRole('button', { name: '更新成绩', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: '更新成绩' })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByPlaceholder('可选，填写补充说明')).toHaveValue('旧备注')
  await expect(dialog.getByRole('button', { name: '确认更新' })).toBeVisible()
})
