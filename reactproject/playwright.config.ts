import { defineConfig } from '@playwright/test'

const chromium = '/home/Ar/.cache/ms-playwright/chromium-1252/chrome-linux64/chrome'

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list'], ['json', { outputFile: '../ref/local/logs/parity-report.json' }]],
  use: {
    headless: true,
    viewport: { width: 1440, height: 900 },
    launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM || chromium },
  },
})
