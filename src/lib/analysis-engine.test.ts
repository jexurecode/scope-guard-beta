
import { describe, expect, it } from 'vitest'
import { analyzeScope } from './analysis-engine'

describe('Scope Guard analysis engine', () => {
  it('detects new e-commerce and payment functionality', () => {
    const result = analyzeScope(
      'Build a five-page business website with a contact form.',
      'Please add an online store with Stripe payments.'
    )

    expect(result.status).toBe('potential-change')
    expect(result.detectedChanges.map((c) => c.feature)).toContain(
      'E-commerce functionality'
    )
    expect(result.detectedChanges.map((c) => c.feature)).toContain(
      'Payment integration'
    )
  })

  it('does not flag an existing checkout feature as new', () => {
    const result = analyzeScope(
      'Build an online store with Stripe checkout.',
      'Please change the checkout button color to blue.'
    )

    expect(result.detectedChanges).toHaveLength(0)
  })

  it('asks for review when request has no recognized features', () => {
    const result = analyzeScope(
      'Design a five-page website.',
      'Can we change the heading font?'
    )

    expect(result.status).toBe('needs-review')
  })

  it('detects a new booking system request', () => {
    const result = analyzeScope(
      'Build a simple company website.',
      'Can you add appointment booking?'
    )

    expect(result.detectedChanges.map((c) => c.feature)).toContain(
      'Booking system'
    )
  })
  
it('does not confuse removing payments with adding payments', () => {
  const result = analyzeScope(
    'Build a simple informational website.',
    'Please remove the payment button from the old design.'
  )

  expect(result.detectedChanges).toHaveLength(0)
})

it('does not flag a feature explicitly excluded from the request', () => {
  const result = analyzeScope(
    'Build a five-page portfolio website.',
    'We do not need an online store or payment integration.'
  )

  expect(result.detectedChanges).toHaveLength(0)
})

it('recognizes a new feature expressed with different wording', () => {
  const result = analyzeScope(
    'Build a five-page business website.',
    'Can customers purchase products directly on the website?'
  )

  expect(result.status).toBe('potential-change')
})

  it('asks for specific clarification on GitHub details and other stuff', () => {
    const result = analyzeScope(
      'Build a portfolio website with About, Projects, and Contact sections.',
      'Add my GitHub details and other stuffs.'
    )
    expect(result.status).toBe('needs-review')
    expect(result.detectedChanges).toHaveLength(0)
    expect(result.reviewNotes?.join(' ')).toMatch(/profile link|project links/)
    expect(result.reviewNotes?.join(' ')).toMatch(/unspecified additional work/)
    expect(result.reply).toMatch(/clarify/i)
  })

  it('does not infer new features from an explicit payment exclusion', () => {
    const result = analyzeScope('Build a company website without online payments.', 'We do not need online payments.')
    expect(result.detectedChanges).toHaveLength(0)
    expect(result.reviewNotes?.join(' ')).not.toMatch(/unspecified additional work|Repository details/)
  })

})
