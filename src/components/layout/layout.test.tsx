import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from '../../App'
import { createSavedAnalysis, WORKSPACE_KEY } from '../../lib/workspace'
import { BottomNav } from './BottomNav'
import { Sidebar } from './Sidebar'

afterEach(() => vi.unstubAllGlobals())

describe('navigation', () => {
  it('renders the five mobile tabs and marks the active one', () => {
    const html = renderToStaticMarkup(<BottomNav view="history" onNavigate={() => {}} />)
    for (const label of ['Home', 'Projects', 'Analyze', 'History', 'More']) expect(html).toContain(`>${label}<`)
    expect(html.match(/aria-current="page"/g)).toHaveLength(1)
    expect(html).toContain('class="bottom-nav lg:hidden"')
  })
  it('keeps the More tab active while viewing Settings', () => {
    const settings = renderToStaticMarkup(<BottomNav view="settings" onNavigate={() => {}} />)
    const more = renderToStaticMarkup(<BottomNav view="more" onNavigate={() => {}} />)
    expect(settings).toBe(more)
  })
  it('renders the desktop sidebar without accounts, plans, or usage limits', () => {
    const html = renderToStaticMarkup(<Sidebar view="dashboard" onNavigate={() => {}} />)
    for (const label of ['Dashboard', 'Projects', 'New analysis', 'History', 'Settings']) expect(html).toContain(label)
    expect(html).not.toMatch(/upgrade|pro plan|usage|free plan/i)
  })
})

describe('dashboard data', () => {
  it('shows real counts and a welcome state with no fabricated activity', () => {
    vi.stubGlobal('localStorage', { getItem: () => null })
    const html = renderToStaticMarkup(<App />)
    expect(html).toContain('Welcome back')
    expect(html).toContain('No projects yet')
    expect(html).toMatch(/notification/i)
expect(html).not.toMatch(/upgrade/i)
  })
  it('labels saved analyses with their project and status', () => {
    const analysis = createSavedAnalysis('p', 'Build a website.', 'Please add an online store with Stripe payments.')
    const data = { version: 1, projects: [{ id: 'p', name: 'Cafe site', agreement: 'Build a website.' }], analyses: [analysis] }
    vi.stubGlobal('localStorage', { getItem: (key: string) => key === WORKSPACE_KEY ? JSON.stringify(data) : null })
    const html = renderToStaticMarkup(<App />)
    expect(html).toContain('Cafe site')
    expect(html).toMatch(/Potential scope change|Manual review/)
  })
})
