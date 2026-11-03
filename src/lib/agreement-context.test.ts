import { describe, expect, it } from 'vitest'
import { analyzeScope } from './analysis-engine'
import { findFeatureMentions } from './feature-context'

const agreement = 'Build a responsive restaurant website with a homepage, menu page, contact page, and photo gallery. No online ordering, payment integration, or booking system is included.'
const request = "The website looks great! Can you also add a table reservation system where customers can select a date and time? We don't need online payments."

it('flags the restaurant reservation request against the exact excluded agreement', () => {
  const result = analyzeScope(agreement, request)
  expect(result.status).toBe('potential-change')
  expect(result.detectedChanges.map(change => change.feature)).toEqual(['Booking system'])
  expect(result.detectedChanges[0].explanation).toContain('exclusion wording')
  expect(result.reviewNotes?.join(' ')).not.toContain('agreement contains uncertain')
  expect(result.reply.toLowerCase()).toContain('booking')
  expect(result.reply.toLowerCase()).not.toContain('payment integration')
})

describe('agreement list classification', () => {
  it.each([
    ['No online ordering, payment integration, or booking system is included.', 'excluded'],
    ['No payment integration, user accounts, or booking system is included.', 'excluded'],
    ['Exclude payment integration, user accounts, and booking.', 'excluded'],
    ['Payment integration, user accounts, and booking are excluded.', 'excluded'],
    ['Payment integration, user accounts, and booking are not included.', 'excluded'],
    ['Payment integration or booking is excluded.', 'excluded'],
    ['Include payment integration, user accounts, and booking.', 'addition'],
    ['Payment integration, user accounts, and booking are included.', 'addition'],
    ['Maybe include payment integration, user accounts, and booking.', 'uncertain'],
    ['Payment integration, user accounts, and booking are optional.', 'uncertain'],
    ['Payment integration or booking may be included.', 'uncertain'],
    ['Maybe no payment integration, user accounts, or booking is included.', 'uncertain'],
    ['Payment integration and booking are both included and excluded.', 'uncertain'],
    ['Payment integration and booking are not excluded.', 'uncertain'],
  ] as const)('%s', (text, intent) => {
    const mentions = findFeatureMentions(text, true)
    expect(mentions.length).toBeGreaterThanOrEqual(2)
    expect(mentions.every(mention => mention.intent === intent)).toBe(true)
  })
  it.each([
    'Include payments, exclude booking.',
    'Payments are included, booking is excluded.',
    'Include payments, but exclude booking.',
  ])('keeps different clauses separate: %s', text => {
    const result = analyzeScope(text, 'Add payments and booking.')
    expect(result.detectedChanges.map(change => change.feature)).toEqual(['Booking system'])
  })
  it.each([
    'Include booking, but exclude booking.',
    'Booking is included, booking is excluded.',
    'Include payments, user accounts, and booking. No payments, user accounts, or booking are included.',
    'Include payments, user accounts, and booking, exclude payments, user accounts, and booking.',
    'Payments are included, payments are excluded, booking is included, booking is excluded.',
    'If approved, no payments, user accounts, or booking are included.',
    'Payments, user accounts, or booking may be excluded.',
  ])('preserves human review for conflicts or uncertainty: %s', text => {
    const result = analyzeScope(text, 'Add booking.')
    expect(result.status).toBe('needs-review')
    expect(result.reviewNotes?.join(' ')).toContain('uncertain or conflicting')
  })
  it('flags every requested feature in an explicit exclusion list', () => {
    const result = analyzeScope(
      'Payment integration, user accounts, and booking are excluded.',
      'Add payments, add user accounts, and add booking.',
    )
    expect(result.detectedChanges.map(change => change.feature)).toEqual([
      'Payment integration', 'User authentication', 'Booking system',
    ])
    expect(result.detectedChanges.every(change => change.explanation.includes('exclusion wording'))).toBe(true)
  })
})
