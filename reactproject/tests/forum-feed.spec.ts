import { test, expect } from '@playwright/test'

const replies = Array.from({ length: 12 }, (_, index) => ({
  id: index + 1,
  authorId: index + 1,
  authorName: `群友${index + 1}`,
  content: `评论内容 ${index + 1}`,
  createdAt: `2026-11-05T10:${String(index).padStart(2, '0')}:00`,
}))

const post = {
  id: 1,
  title: '动态流测试标题',
  authorId: 8,
  authorName: '测试用户',
  titleName: '霓虹先驱',
  titleTier: 'color',
  titleAcquisitionMethod: '测试佩戴称号',
  content: '这是动态正文，用于验证动态内展开评论。',
  status: 'visible',
  replyCount: replies.length,
  createdAt: '2026-11-05T10:00:00',
  likeCount: 3,
  liked: false,
  images: Array.from({ length: 4 }, (_, index) => ({ id: index + 1, url: `/test-image-${index + 1}.jpg` })),
  files: [],
  replies,
}

test('forum feed expands comments in pages of ten and links to uncollapsed detail', async ({ page }) => {
  const feedPosts = [post, { ...post, id: 2, title: '用户乙的动态', authorId: 9, authorName: '用户乙' }, { ...post, id: 3, title: '用户丙的动态', authorId: 10, authorName: '用户丙' }]
  await page.addInitScript(() => sessionStorage.setItem('userInfo', JSON.stringify({ id: 8, account: '测试用户' })))
  await page.route('**/api/forum/posts?*', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ code: 0, data: { list: feedPosts, total: 3 } }),
  }))
  await page.route('**/api/forum/posts/1', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ code: 0, data: post }),
  }))

  await page.goto('http://localhost:5174/forum')
  await expect(page.getByText('动态流测试标题').first()).toBeVisible()
  await expect(page.getByText('霓虹先驱').first()).toBeVisible()
  await expect(page.getByText('霓虹先驱').first()).toHaveAttribute('title', '测试佩戴称号')
  await expect(page.getByText('霓虹先驱').first()).toHaveCSS('background-image', /rgb\(8, 145, 178\)/)
  await expect(page.getByText('霓虹先驱').first()).toHaveCSS('animation-name', 'title-shimmer')
  await expect(page.getByText('霓虹先驱').first()).toHaveCSS('background-size', '300% 100%')
  const firstPost = page.locator('.feed-post').first()
  const sidebar = page.getByRole('complementary', { name: '论坛概览' })
  await expect(sidebar.getByRole('heading', { name: '热点内容' })).toBeVisible()
  await expect(sidebar.getByRole('heading', { name: '活跃用户' })).toBeVisible()
  await expect(sidebar.locator('.forum-active-user')).toHaveCount(3)
  expect(await sidebar.locator('.forum-active-users').evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(' ').length)).toBe(3)
  await expect(firstPost.locator('.feed-media button')).toHaveCount(3)
  await expect(firstPost.locator('.feed-media button').first()).toHaveCSS('border-radius', '0px')
  const thumbnailDimensions = await firstPost.locator('.feed-media button').first().evaluate((element) => ({ width: element.getBoundingClientRect().width, height: element.getBoundingClientRect().height }))
  expect(Math.abs(thumbnailDimensions.width - thumbnailDimensions.height)).toBeLessThanOrEqual(1)
  await expect(firstPost.locator('.feed-action').first()).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
  await expect(firstPost.locator('.feed-report')).toHaveCSS('background-color', 'rgb(184, 50, 64)')
  await expect(firstPost.locator('.feed-report')).toHaveCSS('color', 'rgb(255, 255, 255)')
  await page.screenshot({ path: 'test-results/forum-desktop.png', fullPage: false })
  await expect(firstPost.locator('.feed-content')).toContainText('这是动态正文，用于验证动态内展开评论。')
  await expect(firstPost.getByRole('button', { name: '展开正文' })).toBeVisible()
  await firstPost.getByRole('button', { name: '查看第 1 张图片' }).click()
  const imageDialog = page.getByRole('dialog', { name: '图片预览' })
  await expect(imageDialog.getByRole('img', { name: '动态大图' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(imageDialog).toBeHidden()
  await page.getByRole('button', { name: '展开正文' }).first().click()
  await expect(firstPost.locator('.feed-media button')).toHaveCount(4)
  await page.getByRole('button', { name: '收起' }).first().click()
  await firstPost.getByRole('button', { name: '▤ 12 评论' }).click()
  const expanded = page.getByRole('region', { name: '动态流测试标题 评论' })
  await expect(expanded.getByText('评论内容 1', { exact: true })).toBeVisible()
  await expect(expanded.getByText('评论内容 10', { exact: true })).toBeVisible()
  await expect(expanded.getByText('评论内容 11', { exact: true })).toHaveCount(0)
  await expanded.getByRole('button', { name: '下一页' }).click()
  await expect(expanded.getByText('评论内容 11', { exact: true })).toBeVisible()
  await expect(expanded.getByText('评论内容 12', { exact: true })).toBeVisible()

  await page.goto('http://localhost:5174/forum/1')
  await expect(page.getByRole('heading', { name: 'POST' })).toHaveCount(0)
  await expect(page.getByRole('heading', { name: '回复 12' })).toBeVisible()
  await expect(page.getByText('评论内容 1', { exact: true })).toBeVisible()
  await expect(page.getByText('评论内容 10', { exact: true })).toBeVisible()
  await expect(page.getByText('评论内容 11', { exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: '下一页' }).click()
  await expect(page.getByText('评论内容 11', { exact: true })).toBeVisible()
  await expect(page.getByText('评论内容 12', { exact: true })).toBeVisible()

  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('http://localhost:5174/forum')
  await expect(page.locator('.feed-post .feed-content-toggle strong').first()).toBeVisible()
  await expect(page.getByRole('complementary', { name: '论坛概览' })).toBeHidden()
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
  await page.screenshot({ path: 'test-results/forum-mobile.png', fullPage: false })
})
