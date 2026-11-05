/** Real insecure-origin reproduction, isolated from personal browser data. */
import assert from 'node:assert/strict'
import { writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { preview } from 'vite'
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const { chromium } = await import(process.env.SCOPE_GUARD_PLAYWRIGHT_MODULE ? pathToFileURL(process.env.SCOPE_GUARD_PLAYWRIGHT_MODULE).href : 'playwright')
let server, browser
try {
  server = await preview({ root, preview: { host: '127.0.0.1', port: 0 } })
  const port = server.httpServer.address().port
  const base = `http://127.0.0.1:${port}`
  const origin = `http://scope-guard-http.test:${port}`
  browser = await chromium.launch({ headless: true, ...(process.env.SCOPE_GUARD_CHROMIUM_BINARY ? { executablePath: process.env.SCOPE_GUARD_CHROMIUM_BINARY } : {}), args: JSON.parse(process.env.SCOPE_GUARD_CHROMIUM_ARGS || '[]') })
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
  // Fulfil a non-localhost HTTP origin from the local production preview.
  // Chromium sees a genuinely insecure context; randomUUID is NOT mocked.
  const serveHttp = async route => {
    const url = new URL(route.request().url())
    const response = await route.fetch({ url: `${base}${url.pathname}${url.search}` })
    await route.fulfill({ response })
  }
  await context.route(`${origin}/**`, serveHttp)
  const page = await context.newPage()
  page.setDefaultTimeout(10000)
  const errors = []
  page.on('pageerror', e => errors.push(e.message))
  await page.goto(origin)
  const environment = await page.evaluate(() => ({ secure: isSecureContext, uuid: typeof crypto.randomUUID, randomValues: typeof crypto.getRandomValues }))
  assert.deepEqual(environment, { secure: false, uuid: 'undefined', randomValues: 'function' })
  await page.getByRole('navigation', { name: 'Mobile navigation', exact: true }).getByRole('button', { name: 'Projects', exact: true }).click()
  await page.getByRole('button', { name: 'New project', exact: true }).filter({ visible: true }).first().click()
  await page.getByLabel('Project name', { exact: true }).fill('Mobile HTTP client')
  await page.getByRole('button', { name: 'Create project', exact: true }).click()
  if (process.env.SCOPE_GUARD_EXPECT_BROKEN === '1') {
    await page.waitForTimeout(250)
    assert.ok(errors.some(e => /randomUUID/.test(e)))
    assert.equal(await page.evaluate(() => localStorage.getItem('scope-guard-workspace-v1')), null)
    console.log(JSON.stringify({ reproduced: true, environment, errors }))
  } else {
    await page.getByRole('heading', { name: 'Mobile HTTP client', exact: true }).waitFor()
    await page.getByLabel('What did you agree to deliver?', { exact: true }).fill("Build a landing page. Blog wasn't included.")
    await page.getByRole('button', { name: 'Analyze a request', exact: true }).click()
    await page.getByLabel('What is your client asking for?', { exact: true }).fill('Please add a blog with a page for each article.')
    await page.getByRole('button', { name: 'Analyze scope', exact: true }).click()
    await page.getByLabel('Suggested client response', { exact: true }).waitFor()
    const before = await page.evaluate(() => localStorage.getItem('scope-guard-workspace-v1'))
    const data = JSON.parse(before)
    assert.equal(data.projects.length, 1)
    assert.equal(data.analyses.length, 1)
    assert.notEqual(data.projects[0].id, data.analyses[0].id)
    assert.equal(data.analyses[0].result.status, 'potential-change')
    await page.reload()
    assert.equal(await page.evaluate(() => localStorage.getItem('scope-guard-workspace-v1')), before)
    assert.deepEqual(errors, [])
    const unavailable = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
    await unavailable.route(`${origin}/**`, serveHttp)
    const errorPage = await unavailable.newPage()
    errorPage.on('pageerror', e => errors.push(e.message))
    await errorPage.addInitScript(() => {
      Object.defineProperty(crypto, 'getRandomValues', { value: undefined, configurable: true })
      localStorage.setItem('scope-guard-workspace-v1', JSON.stringify({ version: 1, projects: [{ id: 'existing', name: 'Existing client', agreement: 'Original agreement' }], analyses: [] }))
    })
    await errorPage.goto(origin)
    const existing = await errorPage.evaluate(() => localStorage.getItem('scope-guard-workspace-v1'))
    await errorPage.getByRole('navigation', { name: 'Mobile navigation', exact: true }).getByRole('button', { name: 'Projects', exact: true }).click()
    await errorPage.getByRole('button', { name: 'New project', exact: true }).filter({ visible: true }).first().click()
    await errorPage.getByLabel('Project name', { exact: true }).fill('Cannot generate ID')
    await errorPage.getByRole('button', { name: 'Create project', exact: true }).click()
    await errorPage.getByRole('alert').filter({ hasText: 'Could not create the project' }).waitFor()
    assert.equal(await errorPage.evaluate(() => localStorage.getItem('scope-guard-workspace-v1')), existing)
    assert.deepEqual(errors, [])
    // Both isolated profiles are disposed together by browser.close() below.
    const report = { passed: true, environment, checks: ['mobile HTTP project creation', 'analysis save', 'refresh persistence', 'visible failure with existing data preserved when all randomness is unavailable'], errors }
    console.log(JSON.stringify(report))
    if (process.env.SCOPE_GUARD_MOBILE_REPORT) await writeFile(process.env.SCOPE_GUARD_MOBILE_REPORT, JSON.stringify(report, null, 2) + '\n')
  }
} finally {
  await browser?.close()
  if (server) await new Promise(resolve => server.httpServer.close(resolve))
}
