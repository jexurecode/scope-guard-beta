import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
import { AnalysisResult } from './AnalysisResult'
import { AnalysisHistory } from './AnalysisHistory'
import { createSavedAnalysis, WORKSPACE_KEY } from '../lib/workspace'

afterEach(() => vi.unstubAllGlobals())

describe('workspace rendering', () => {
  it('shows a useful first-run state', () => {
    vi.stubGlobal('localStorage', { getItem: () => null })
    const html = renderToStaticMarkup(<App />)
    expect(html).toContain('Your workspace')
    expect(html).toContain('Switch to dark mode')
    expect(html).not.toContain('id="agreement"')
  })
  it('renders a restored project and its history', () => {
    const analysis = createSavedAnalysis('p', 'Original agreement', 'Add booking.')
    const data = { version: 1, projects: [{ id: 'p', name: 'Client site', agreement: 'Updated agreement' }], analyses: [analysis] }
    vi.stubGlobal('localStorage', { getItem: (key: string) => key === WORKSPACE_KEY ? JSON.stringify(data) : null })
    const html = renderToStaticMarkup(<App />)
    expect(html).toContain('Client site')
    expect(html).toContain('Recent activity')
    expect(html).toContain('Add booking.')
    expect(html).toContain('History')
    expect(html).toContain('New analysis')
    expect(html).toContain('Projects')
  })
  it('renders recovery instructions for corrupt saved data', () => {
    vi.stubGlobal('localStorage', { getItem: () => '{broken' })
    expect(renderToStaticMarkup(<App />)).toContain('Replace saved workspace')
  })
  it('renders the edited response safely as editable text', () => {
    const analysis = createSavedAnalysis('p', 'Website', 'Add booking.')
    analysis.result.reply = '<script>alert(1)</script>'
    const html = renderToStaticMarkup(<AnalysisResult result={analysis.result} copied={false} copyReply={async () => {}} onReplyChange={() => {}} />)
    expect(html).toContain('textarea id="reply"')
    expect(html).toContain('&lt;script&gt;')
    expect(html).not.toContain('<script>')
    expect(html).toContain('Preliminary analysis')
  })
  it('shows history guidance when no analyses exist', () => {
    expect(renderToStaticMarkup(<AnalysisHistory items={[]} onOpen={() => {}} />)).toContain('No analyses yet')
  })
})

describe('analysis review notes', () => {
  it('renders context explanations alongside editable replies', () => {
    const saved = createSavedAnalysis('p', 'Website.', "Don't add payments, but add booking.")
    const html = renderToStaticMarkup(<AnalysisResult result={saved.result} copied={false} copyReply={async () => {}} onReplyChange={() => {}} />)
    expect(html).toContain('Items for human review')
    expect(html).toContain('exclusion or removal wording')
    expect(html).toContain('Booking system')
    expect(html).toContain('textarea id="reply"')
  })
  it('renders legacy results without optional notes', () => {
    const saved = createSavedAnalysis('p', 'Website.', 'Add booking.')
    delete saved.result.reviewNotes
    const html = renderToStaticMarkup(<AnalysisResult result={saved.result} copied={false} copyReply={async () => {}} onReplyChange={() => {}} />)
    expect(html).toContain('Preliminary analysis')
    expect(html).not.toContain('Items for human review')
  })
})
