import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('theme', 'light'))
})

test('light theme uses the supplied artwork directly with readable glass surfaces', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  const backgroundResponse = page.waitForResponse((response) => response.url().endsWith('/bakground_1.JPG'))
  await page.goto('http://localhost:5174/home')
  expect((await backgroundResponse).ok()).toBe(true)
  await expect(page.locator('html')).toHaveClass(/light/)

  const background = await page.locator('.bg').evaluate((element) => {
    const style = getComputedStyle(element)
    return { image: style.backgroundImage, filter: style.filter, opacity: style.opacity }
  })
  expect(background.image).toContain('bakground_1.JPG')
  expect(background.filter).toBe('none')
  expect(background.opacity).toBe('1')
  expect(await page.locator('.bg').evaluate((element) => getComputedStyle(element).backgroundSize)).toBe('contain')

  const card = page.locator('.detail-card').first()
  await expect(card).toBeVisible()
  const cardColors = await card.evaluate((element) => ({
    background: getComputedStyle(element).backgroundColor,
    color: getComputedStyle(element).color,
    border: getComputedStyle(element).borderTopColor,
  }))
  expect(cardColors.background).not.toBe('rgb(255, 255, 255)')
  expect(cardColors.color).toBe('rgb(16, 44, 64)')
  const featureSurface = await page.locator('.disc-info').evaluate((element) => ({
    background: getComputedStyle(element).backgroundColor,
    filter: getComputedStyle(element).backdropFilter,
  }))
  expect(featureSurface.background).toBe('rgba(0, 0, 0, 0)')
  expect(featureSurface.filter).toBe('none')
  await page.screenshot({ path: '/tmp/dsh-light-desktop.png', fullPage: false })
})

test('mobile home feature content is centered and fully inside the disc in light mode', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('http://localhost:5174/home')
  await expect(page.locator('html')).toHaveClass(/light/)
  const disc = page.locator('.disc')
  const content = page.locator('.disc-info')
  await expect(content.locator('h1')).toBeVisible()
  await expect(content.getByRole('button', { name: '课题', exact: true })).toBeVisible()
  await expect(content.getByRole('button', { name: /进入课题/ })).toBeVisible()

  const bounds = await page.evaluate(() => {
    const discRect = document.querySelector('.disc')!.getBoundingClientRect()
    const contentRect = document.querySelector('.disc-info')!.getBoundingClientRect()
    return {
      disc: { left: discRect.left, top: discRect.top, right: discRect.right, bottom: discRect.bottom },
      content: { left: contentRect.left, top: contentRect.top, right: contentRect.right, bottom: contentRect.bottom },
      centerOffset: Math.abs((contentRect.left + contentRect.right) / 2 - (discRect.left + discRect.right) / 2),
    }
  })
  expect(bounds.centerOffset).toBeLessThanOrEqual(1)
  expect(bounds.content.left).toBeGreaterThan(bounds.disc.left)
  expect(bounds.content.right).toBeLessThan(bounds.disc.right)
  expect(bounds.content.top).toBeGreaterThan(bounds.disc.top)
  expect(bounds.content.bottom).toBeLessThan(bounds.disc.bottom)
  await page.screenshot({ path: '/tmp/dsh-light-mobile.png', fullPage: false })
})

test('dark home disc uses a subtle 25% radial text veil', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('theme', 'dark'))
  await page.goto('http://localhost:5174/home')
  const veil = await page.locator('.disc-info').evaluate((element) => getComputedStyle(element, '::before').backgroundImage)
  expect(veil).toContain('0.25')
  expect(veil).toContain('radial-gradient')
})

