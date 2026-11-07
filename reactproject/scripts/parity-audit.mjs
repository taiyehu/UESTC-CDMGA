#!/usr/bin/env node
/**
 * Vue3 vs React functional parity auditor.
 * Uses Playwright (open source) to crawl the same local routes on both apps and
 * compare page availability, headings, controls, inputs, table rows and API calls.
 *
 * Usage: VUE_URL=http://localhost:8082 REACT_URL=http://localhost:5174 node scripts/parity-audit.mjs
 */
import { chromium } from '@playwright/test'
import fs from 'node:fs/promises'
import path from 'node:path'

const VUE = process.env.VUE_URL || 'http://localhost:8082'
const REACT = process.env.REACT_URL || 'http://localhost:5174'
const OUT = process.env.AUDIT_OUT || '/home/Ar/UESTC-CDMGA/ref/local/logs/parity-audit.json'
const EXEC = process.env.CHROME_PATH || '/home/Ar/.cache/ms-playwright/chromium-1252/chrome-linux64/chrome'

const routes = [
  '/home', '/task', '/task/95', '/task/83', '/task/83/bingo/11', '/activity', '/activity/1',
  '/ranking', '/ranking-new', '/contest-ranking', '/forum', '/forum/1', '/awards', '/links',
  '/profile/1', '/profile-setting',
]
const adminRoutes = [
  '/admin', '/admin/users', '/admin/courses', '/admin/content-publish', '/admin/activities',
  '/admin/scores', '/admin/profiles', '/admin/profiles-passed', '/admin/titles', '/admin/forum',
  '/admin/bingo-submissions', '/admin/bingo-tips', '/admin/issues', '/admin/teams',
  '/admin/rank-configs', '/admin/score-logs',
]

function uniq(values) { return [...new Set(values.map((v) => String(v).replace(/\s+/g, ' ').trim()).filter(Boolean))] }
const GLOBAL_CONTROLS = new Set(['视觉效果：开', '视觉效果：关', '登出', '管理', '上一页', '下一页', '首页', '尾页', '跳转', '关闭', '取消', '排行榜', '排行', '网站功能', '链接'])
const GLOBAL_API = new Set(['/api/identity/heartbeat', '/api/profile/identity/:id'])
function meaningfulControls(values) {
  return uniq(values).filter((v) => {
    if (GLOBAL_CONTROLS.has(v)) return false
    if (/^\d+$/.test(v)) return false
    if (/^(＋|\+|→|←|↩|♡|♥)\s*/.test(v)) return false
    return v.length >= 3
  })
}
function normalizeApi(url) {
  try {
    const u = new URL(url)
    if (!u.pathname.startsWith('/api/')) return null
    return u.pathname.replace(/\/\d+(?=\/|$)/g, '/:id').replace(/\/[0-9a-f-]{20,}(?=\/|$)/gi, '/:id')
  } catch { return null }
}

async function login(page, base, account) {
  await page.goto(`${base}/login`, { waitUntil: 'domcontentloaded' })
  await page.getByPlaceholder('请输入用户名').fill(account)
  await page.getByPlaceholder('请输入密码').fill('test123456')
  await page.getByRole('button', { name: '登录', exact: true }).click()
  await page.waitForURL('**/home', { timeout: 20000 }).catch(() => {})
  await page.waitForTimeout(600)
}

async function capture(page, base, route) {
  const api = new Set()
  const errors = []
  const onRequest = (req) => { const p = normalizeApi(req.url()); if (p) api.add(p) }
  const onError = (err) => errors.push(err.message)
  page.on('request', onRequest)
  page.on('pageerror', onError)
  await page.goto(`${base}${route}`, { waitUntil: 'domcontentloaded' }).catch((e) => errors.push(e.message))
  await page.waitForTimeout(1200)
  const data = await page.evaluate(() => {
    const visible = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 }
    const text = (el) => (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim()
    return {
      title: document.title,
      body: document.body.innerText.slice(0, 4000),
      headings: [...document.querySelectorAll('h1,h2,h3')].filter(visible).map(text).filter(Boolean),
      buttons: [...document.querySelectorAll('button')].filter(visible).map(text).filter(Boolean),
      links: [...document.querySelectorAll('a')].filter(visible).map(text).filter(Boolean),
      inputs: [...document.querySelectorAll('input,select,textarea')].filter(visible).map((el) => el.getAttribute('placeholder') || el.getAttribute('aria-label') || el.getAttribute('name') || el.getAttribute('type') || ''),
      tableRows: document.querySelectorAll('table tbody tr').length,
    }
  })
  page.off('request', onRequest)
  page.off('pageerror', onError)
  return { ...data, api: [...api].sort(), errors: uniq(errors) }
}

function compare(vue, react) {
  const missingApi = vue.api.filter((x) => !GLOBAL_API.has(x) && !react.api.includes(x))
  const extraApi = react.api.filter((x) => !GLOBAL_API.has(x) && !vue.api.includes(x))
  const vueControls = meaningfulControls([...vue.buttons, ...vue.links])
  const reactControls = meaningfulControls([...react.buttons, ...react.links])
  const missingControls = vueControls.filter((x) => !reactControls.includes(x)).slice(0, 12)
  const missingLinks = []
  return {
    apiMissingInReact: missingApi,
    apiExtraInReact: extraApi,
    controlsMissingInReact: missingControls,
    linksMissingInReact: missingLinks,
    vueHeadings: vue.headings.slice(0, 8),
    reactHeadings: react.headings.slice(0, 8),
    vueRows: vue.tableRows,
    reactRows: react.tableRows,
    vueErrors: vue.errors,
    reactErrors: react.errors,
  }
}

const browser = await chromium.launch({ executablePath: EXEC, headless: true })
const result = { generatedAt: new Date().toISOString(), vue: VUE, react: REACT, public: {}, admin: {}, summary: {} }
try {
  for (const account of ['tester', 'admin']) {
    const bucket = account === 'tester' ? result.public : result.admin
    const list = account === 'tester' ? routes : adminRoutes
    for (const baseName of ['vue', 'react']) {
      const base = baseName === 'vue' ? VUE : REACT
      const context = await browser.newContext()
      const page = await context.newPage()
      await login(page, base, account)
      for (const route of list) bucket[route] ||= {}
      for (const route of list) bucket[route][baseName] = await capture(page, base, route)
      await context.close()
    }
  }
  for (const [route, entry] of Object.entries({ ...result.public, ...result.admin })) {
    if (!entry.vue || !entry.react) continue
    result.summary[route] = compare(entry.vue, entry.react)
  }
  const missingRoutes = Object.entries(result.summary).filter(([, s]) => s.reactErrors.length && s.vueErrors.length === 0).map(([r]) => r)
  result.summary.overall = {
    auditedRoutes: Object.keys(result.summary).filter((r) => r !== 'overall').length,
    routesWithNewReactErrors: missingRoutes.length,
    apiGaps: Object.values(result.summary).flatMap((s) => s.apiMissingInReact || []).length,
    controlGaps: Object.values(result.summary).flatMap((s) => s.controlsMissingInReact || []).length,
  }
  await fs.mkdir(path.dirname(OUT), { recursive: true })
  await fs.writeFile(OUT, JSON.stringify(result, null, 2))
  const lines = ['# Vue3 vs React parity audit', '', `Generated: ${result.generatedAt}`, '', `Routes audited: ${result.summary.overall.auditedRoutes}`, '', `React errors on routes clean in Vue: ${result.summary.overall.routesWithNewReactErrors}`, '', `API gaps: ${result.summary.overall.apiGaps}`, '', `Control gaps: ${result.summary.overall.controlGaps}`, '', '## Route gaps', '']
  for (const [route, s] of Object.entries(result.summary)) {
    if (route === 'overall') continue
    if (s.apiMissingInReact.length || s.controlsMissingInReact.length || s.reactErrors.length) {
      lines.push(`### ${route}`)
      if (s.apiMissingInReact.length) lines.push(`- API missing: ${s.apiMissingInReact.join(', ')}`)
      if (s.controlsMissingInReact.length) lines.push(`- Controls missing: ${s.controlsMissingInReact.join(', ')}`)
      if (s.reactErrors.length) lines.push(`- React errors: ${s.reactErrors.join('; ')}`)
      lines.push('')
    }
  }
  await fs.writeFile(OUT.replace(/\.json$/, '.md'), lines.join('\n'))
  console.log(JSON.stringify(result.summary.overall, null, 2))
  console.log('report', OUT)
} finally {
  await browser.close()
}
