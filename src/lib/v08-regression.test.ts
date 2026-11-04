import { describe, expect, it } from 'vitest'
import { analyzeScope } from './analysis-engine'
import { splitClientTasks } from './task-analysis'

const basicAgreement = 'Build a five-page business website with a contact form.'

describe('v0.8 regression: preserve qualified and quoted request context', () => {
  it.each([
    'When we launch, add payments.',
    'If we expand, add payments.',
    'The client said "add payments and add booking and add login".',
    'Maybe add payments and add booking.',
  ])('does not upgrade conditional or quoted additions: %s', request => {
    expect(splitClientTasks(request)).toHaveLength(1)
    const result = analyzeScope(basicAgreement, request)
    expect(result.status).toBe('needs-review')
    expect(result.detectedChanges).toEqual([])
    expect(result.tasks?.map(task => task.verdict)).toEqual(['needs-review'])
  })

  it('keeps a conditional task separate from a later definite task', () => {
    const result = analyzeScope(basicAgreement, 'When we launch, add payments. Add booking now.')
    expect(result.detectedChanges.map(change => change.feature)).toEqual(['Booking system'])
    expect(result.tasks?.map(task => task.verdict)).toEqual(['needs-review', 'potential-change'])
  })

  it('does not extend a conditional clause past a semicolon', () => {
    const result = analyzeScope(basicAgreement, 'If we expand, add payments; add booking now.')
    expect(result.detectedChanges.map(change => change.feature)).toEqual(['Booking system'])
    expect(result.tasks?.map(task => task.verdict)).toEqual(['needs-review', 'potential-change'])
  })

  it('keeps explicit independent requests split for mixed-scope analysis', () => {
    expect(splitClientTasks('Update homepage text, replace gallery photos, and add a booking system.')).toHaveLength(3)
  })

  it('names the excluded booking capability in a multi-task client reply', () => {
    const agreement = 'Build a responsive restaurant website with a homepage, menu page, contact page, and photo gallery. No online ordering, payment integration, or booking system is included.'
    const request = "The website looks great! Can you also add a table reservation system where customers can select a date and time? We don't need online payments."
    const result = analyzeScope(agreement, request)
    expect(result.detectedChanges.map(change => change.feature)).toEqual(['Booking system'])
    expect(result.reply.toLowerCase()).toContain('booking')
    expect(result.reply.toLowerCase()).not.toContain('payment integration')
  })
})
