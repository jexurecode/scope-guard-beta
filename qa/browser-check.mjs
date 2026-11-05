/** Optional QA runner. See QA-README.md; does not add app dependencies. */
import assert from 'node:assert/strict'
import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, join, resolve } from 'node:path'
import { preview } from 'vite'
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const fixtures = join(root, 'qa/fixtures')
const manifest = JSON.parse(await readFile(join(fixtures, 'manifest.json'), 'utf8'))
const playwright = await import(process.env.SCOPE_GUARD_PLAYWRIGHT_MODULE ? pathToFileURL(process.env.SCOPE_GUARD_PLAYWRIGHT_MODULE).href : 'playwright')
const results = []
const errors = []
const externalRequests = []
let browser, server
async function check(name, fn) { await fn(); results.push(name); console.log('PASS', name) }
try {
  server = await preview({ root, preview: { host: '127.0.0.1', port: 0, strictPort: true } })
  const port = server.httpServer.address().port
  const base = `http://127.0.0.1:${port}`
  browser = await playwright.chromium.launch({
    headless: true,
    ...(process.env.SCOPE_GUARD_CHROMIUM_BINARY ? { executablePath: process.env.SCOPE_GUARD_CHROMIUM_BINARY } : {}),
    args: process.env.SCOPE_GUARD_CHROMIUM_ARGS ? JSON.parse(process.env.SCOPE_GUARD_CHROMIUM_ARGS) : [],
  })
  const context = await browser.newContext({ viewport: { width: 1366, height: 768 }, colorScheme: 'dark', reducedMotion: 'reduce' })
  const page = await context.newPage()
  page.setDefaultTimeout(15000)
  page.on('pageerror', error => errors.push(error.message))
  page.on('request', request => { if (!request.url().startsWith(base) && /^https?:/.test(request.url())) externalRequests.push(request.url()) })
  const visibleButton = name => page.getByRole('button', { name, exact: true }).filter({ visible: true }).first()
  const state = () => page.evaluate(() => JSON.parse(localStorage.getItem('scope-guard-workspace-v1')))
  const agreement = () => page.getByLabel('What did you agree to deliver?', { exact: true })
  async function projects() { await page.getByRole('navigation', { name: 'Main navigation', exact: true }).getByRole('button', { name: 'Projects', exact: true }).click() }
  async function create(name) { await projects(); await visibleButton('New project').click(); await page.getByLabel('Project name', { exact: true }).fill(name); await visibleButton('Create project').click() }
  async function importFile(name, target = 'original agreement') {
    await page.getByLabel(`Import ${target} file`, { exact: true }).setInputFiles(join(fixtures, name))
  }
  async function analyze(request) {
    if (await visibleButton('Start a new request').isVisible()) await visibleButton('Start a new request').click()
    else if (await visibleButton('Analyze a request').isVisible()) await visibleButton('Analyze a request').click()
    await page.getByLabel('What is your client asking for?', { exact: true }).fill(request)
    await visibleButton('Analyze scope').click()
    await page.getByLabel('Suggested client response', { exact: true }).waitFor()
    return (await state()).analyses[0]
  }
  await page.goto(base)
  await check('Fresh workspace defaults to light despite dark system preference', async () => {
    assert.equal(await page.locator('html').evaluate(e => e.classList.contains('dark')), false)
    assert.equal(await state(), null)
  })
  await check('Sample analysis does not create or modify projects', async () => {
    await visibleButton('Try sample analysis').click()
    await page.locator('#sample-tasks').waitFor({ state: 'visible' })
    assert.match(await page.locator('#sample-tasks').textContent(), /Task 3: Potential change/)
    assert.equal(await state(), null)
    await visibleButton('Hide example').click()
  })
  for (const ext of ['txt', 'docx', 'pdf']) {
    await check(`${ext.toUpperCase()}: import full 50K+ contract, mixed request and explicit blog exclusion`, async () => {
      await create(`QA ${ext.toUpperCase()}`)
      await importFile(`restaurant-agreement.${ext}`)
      await page.getByText(`Imported "restaurant-agreement.${ext}"`, { exact: false }).waitFor()
      const text = await agreement().inputValue()
      assert.ok(text.length > 50000)
      assert.ok(text.includes(manifest.sentinel))
      assert.ok(text.includes('Blog functionality is not included'))
      if (ext === 'txt') assert.equal(text.length, manifest.agreementCharacters)
      await visibleButton('Analyze a request').click()
      await importFile('mixed-request.txt', 'new client request')
      await page.getByText('Imported "mixed-request.txt"', { exact: false }).waitFor()
      const result = await analyze(await readFile(join(fixtures, 'mixed-request.txt'), 'utf8'))
      assert.deepEqual(result.result.tasks.map(t => t.verdict), manifest.mixedVerdicts)
      assert.match(result.result.tasks[2].agreementEvidence, /excluded/i)
      assert.equal(result.agreement, text)
      const blog = await analyze('Please add a blog with a page for each article.')
      assert.equal(blog.result.status, 'potential-change')
      assert.match(blog.result.reply, /blog/i)
      assert.match(blog.result.tasks[0].agreementEvidence, /not included/i)
    })
  }
  await check('Past-tense blog exclusion retains evidence in the browser', async () => {
    await create('QA past tense')
    await agreement().fill("Build a landing page. Blog wasn't included in the original agreement.")
    const blog = await analyze('Please add a blog with a page for each article.')
    assert.equal(blog.result.status, 'potential-change')
    assert.match(blog.result.tasks[0].agreementEvidence, /was not included/i)
  })
  await check('Edited reply and complete original snapshots survive refresh unchanged', async () => {
    await page.getByLabel('Suggested client response', { exact: true }).fill('QA edited professional response - preserved after refresh.')
    const before = await state()
    await page.reload()
    assert.deepEqual(await state(), before)
    assert.ok(before.projects.filter(p => /^QA (TXT|DOCX|PDF)$/.test(p.name)).every(p => p.agreement.length > 50000 && p.agreement.includes(manifest.sentinel)))
    assert.equal(before.analyses[0].result.reply, 'QA edited professional response - preserved after refresh.')
  })
  await check('Project cards are bounded and full agreement is scrollable without truncation', async () => {
    await projects()
    const first = page.locator('main ul > li').first()
    assert.ok((await first.locator('p').first().textContent()).length <= 175)
    await first.getByRole('button', { name: 'View Full Agreement', exact: true }).click()
    const full = page.getByRole('region', { name: 'Full agreement', exact: true })
    assert.ok((await full.textContent()).includes(manifest.sentinel))
    const scroll = await full.locator('[tabindex="0"]').evaluate(e => ({ overflow: getComputedStyle(e).overflowY, scroll: e.scrollHeight, client: e.clientHeight }))
    assert.equal(scroll.overflow, 'auto')
    assert.ok(scroll.scroll > scroll.client)
  })
  await check('Duplicate name offers existing request, and separate engagement requires explicit choice', async () => {
    const count = (await state()).projects.length
    await visibleButton('New project').click()
    await page.getByLabel('Project name', { exact: true }).fill('  qa txt  ')
    await visibleButton('Create project').click()
    await page.getByRole('alert').waitFor()
    assert.equal((await state()).projects.length, count)
    await visibleButton('Add a new client request to existing project').click()
    assert.equal((await state()).projects.length, count)
    assert.equal(await agreement().inputValue(), (await state()).projects[0].agreement)
    assert.equal(await page.getByLabel('What is your client asking for?', { exact: true }).inputValue(), '')
    await create('qa TXT')
    await visibleButton('Create separate project for a different engagement').click()
    assert.equal((await state()).projects.length, count + 1)
    assert.equal((await state()).projects.at(-1).agreement, '')
  })
  await check('Import failures preserve the existing agreement; scanned pages are not silently accepted', async () => {
    await agreement().fill('KEEP THIS AGREEMENT INTACT')
    for (const [file, message] of [['empty.txt', /empty/i], ['malformed.docx', /could not read/i], ['malformed.pdf', /could not read/i], ['image-only.pdf', /no selectable text/i]]) {
      await importFile(file)
      await page.getByRole('alert').filter({ hasText: message }).waitFor()
      assert.equal(await agreement().inputValue(), 'KEEP THIS AGREEMENT INTACT')
    }
    await page.getByLabel('Import original agreement file', { exact: true }).setInputFiles({ name: 'overlimit.txt', mimeType: 'text/plain', buffer: Buffer.from('x'.repeat(150001)) })
    await page.getByRole('alert').filter({ hasText: /above the.*limit/i }).waitFor()
    assert.equal(await agreement().inputValue(), 'KEEP THIS AGREEMENT INTACT')
    await importFile('partial-scan.pdf')
    await page.getByText('Imported "partial-scan.pdf"', { exact: false }).waitFor()
    assert.match(await page.getByRole('status').filter({ hasText: 'partial-scan.pdf' }).textContent(), /no selectable text/i)
  })
  await check('Project workspace history remains isolated', async () => {
    await projects()
    await page.locator('main ul > li').filter({ has: page.getByRole('heading', { name: 'QA PDF', exact: true }) }).getByRole('button', { name: 'Open project', exact: true }).click()
    const history = page.getByRole('region', { name: 'Analysis history', exact: true })
    // History section has an accessible heading; compare rows with this project's saved records.
    const project = (await state()).projects.find(p => p.name === 'QA PDF')
    const expected = (await state()).analyses.filter(a => a.projectId === project.id)
    assert.equal(await history.locator('li').count(), expected.length)
    assert.equal(expected.length, 2)
  })
  await check('Desktop and mobile: no overflow, usable navigation and manual theme', async () => {
    await page.getByRole('navigation', { name: 'Main navigation', exact: true }).getByRole('button', { name: 'Dashboard', exact: true }).click()
    for (const width of [320, 390, 768, 1024, 1366]) {
      await page.setViewportSize({ width, height: 844 })
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false)
      if (width < 1024) assert.ok(await page.getByRole('navigation', { name: 'Mobile navigation', exact: true }).isVisible())
    }
    await visibleButton('Switch to dark mode').click()
    assert.equal(await page.locator('html').evaluate(e => e.classList.contains('dark')), true)
    await page.reload()
    assert.equal(await page.locator('html').evaluate(e => e.classList.contains('dark')), true)
  })
  assert.deepEqual(errors, [], 'uncaught browser exceptions')
  assert.deepEqual(externalRequests, [], 'documents and analyses must remain local')
  console.log(JSON.stringify({ passed: results.length, results, errors, externalRequests }, null, 2))
  if (process.env.SCOPE_GUARD_QA_REPORT) await writeFile(process.env.SCOPE_GUARD_QA_REPORT, JSON.stringify({ passed: results.length, results, errors, externalRequests }, null, 2) + '\n')
} finally {
  await browser?.close()
  if (server) await new Promise(resolve => server.httpServer.close(resolve))
}
