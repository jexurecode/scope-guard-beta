import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
import { createSavedAnalysis, WORKSPACE_KEY } from '../lib/workspace'
import { Sparkline } from './Sparkline'

afterEach(() => vi.unstubAllGlobals())

describe('Sparkline', () => {
  it('draws a curve, gradient fill and latest-point marker for real activity', () => {
    const html = renderToStaticMarkup(<Sparkline values={[0, 1, 0, 2, 3, 0, 4]} label="Analyses" />)
    expect(html).toContain('linearGradient')
    expect(html).toContain('spark-dot')
    expect(html).toContain('over the past seven days, oldest first: 0, 1, 0, 2, 3, 0, 4')
  })
  it('shows a neutral baseline, not a trend, when there was no activity', () => {
    const html = renderToStaticMarkup(<Sparkline values={[0, 0, 0, 0, 0, 0, 0]} label="Analyses" />)
    expect(html).toContain('no activity in the past seven days')
    expect(html).not.toContain('linearGradient')
    expect(html).not.toContain('spark-dot')
  })
  it('shows a dashed neutral fallback when no history exists', () => {
    const html = renderToStaticMarkup(<Sparkline values={null} label="Projects" />)
    expect(html).toContain('no history is tracked for this metric')
    expect(html).toContain('stroke-dasharray')
    expect(html).not.toContain('linearGradient')
  })
})

describe('dashboard metric cards', () => {
  it('charts analyses from saved data and gives Projects the neutral fallback', () => {
    const analysis = createSavedAnalysis('p', 'Build a website.', 'Please add an online store with Stripe payments.')
    const data = { version: 1, projects: [{ id: 'p', name: 'Cafe site', agreement: 'Build a website.' }], analyses: [analysis] }
    vi.stubGlobal('localStorage', { getItem: (key: string) => (key === WORKSPACE_KEY ? JSON.stringify(data) : null) })
    const html = renderToStaticMarkup(<App />)
    expect(html).toContain('Projects: no history is tracked for this metric')
    expect(html).toMatch(/Analyses over the past seven days, oldest first: 0, 0, 0, 0, 0, 0, 1/)
    expect(html).toContain('↑ ')
    for (const tone of ['tone-purple', 'tone-violet', 'tone-amber', 'tone-emerald']) expect(html).toContain(tone)
  })
})
