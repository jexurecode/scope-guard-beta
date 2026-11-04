import { describe, expect, it } from 'vitest'
import { analyzeScope } from './analysis-engine'

const portfolio = 'I need a website of a complete coverage on creating a portfolio.'

describe('v0.6 phase 2: admin and content editing requests', () => {
  it('flags the actual admin tag for editing web info scenario as a potential change', () => {
    const result = analyzeScope(portfolio, 'We need an addition of a simple admin tag for editing the web info.')
    expect(result.status).toBe('potential-change')
    expect(result.detectedChanges.some(change => change.feature === 'Admin dashboard')).toBe(true)
    expect(result.reviewNotes?.join(' ')).toMatch(/one-time content update|editing interface/)
    expect(result.reply).toMatch(/edit the content yourself/)
    expect(result.reply).toMatch(/original agreement/)
  })

  it('recognizes explicit CMS addition to a basic website', () => {
    const result = analyzeScope('Create a static portfolio website.', 'Please add a CMS so I can edit content myself.')
    expect(result.detectedChanges.map(change => change.feature)).toContain('Content management system')
  })

  it('does not treat an editing capability already mentioned in the agreement as new', () => {
    const result = analyzeScope('Build a portfolio with an admin panel to edit website content.', 'Please add an admin panel to edit website content.')
    expect(result.detectedChanges).toHaveLength(0)
  })

  it('does not mistake a one-time text edit for a CMS', () => {
    const result = analyzeScope(portfolio, 'Please update the About text on my portfolio.')
    expect(result.detectedChanges).toHaveLength(0)
  })

  it('does not flag an admin link as a new dashboard', () => {
    const result = analyzeScope(portfolio, 'Please add a link to the admin panel.')
    expect(result.detectedChanges).toHaveLength(0)
  })

  it('does not flag an admin feature explicitly excluded by the client', () => {
    const result = analyzeScope(portfolio, 'We do not need an admin panel for editing website content.')
    expect(result.detectedChanges).toHaveLength(0)
  })

  it('asks meaningful questions for ambiguous GitHub and other stuff wording', () => {
    const result = analyzeScope('Build a portfolio with Projects section.', 'Add my GitHub details and other stuffs.')
    expect(result.status).toBe('needs-review')
    expect(result.reply).toMatch(/GitHub profile link/)
    expect(result.reviewNotes?.join(' ')).toMatch(/unspecified additional work/)
  })

  it('preserves unrelated feature detection and negative wording', () => {
    const result = analyzeScope(portfolio, 'Add an online store and Stripe payments. We do not need bookings.')
    expect(result.detectedChanges.map(change => change.feature)).toEqual(['E-commerce functionality', 'Payment integration'])
  })
})
