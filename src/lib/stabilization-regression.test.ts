import { describe, expect, it } from 'vitest'
import { analyzeScope } from './analysis-engine'

describe('v0.9.1 stabilization: explicit exclusions in past and perfect tense', () => {
  it.each([
    "Blog wasn't included in the original agreement.",
    'Blog was not included in the original agreement.',
    "Booking systems weren't included in this engagement.",
    'Booking systems were not included in this engagement.',
    'Blog has not been included in the agreed scope.',
    'Booking systems have not been included in the agreed scope.',
  ])('preserves exclusion evidence: %s', agreement => {
    const capability = agreement.startsWith('Blog') ? 'blog' : 'booking system'
    const result = analyzeScope(agreement, `Please add a ${capability}.`)
    expect(result.status).toBe('potential-change')
    expect(result.tasks?.[0].verdict).toBe('potential-change')
    expect(result.tasks?.[0].agreementEvidence).toBeTruthy()
    expect(result.reply.toLowerCase()).toContain(capability.split(' ')[0])
  })
  it.each([
    'Blog was not necessarily excluded.',
    'Blog might not have been included.',
    'If we expand, blog will not be included.',
  ])('keeps qualified agreement wording under review: %s', agreement => {
    expect(analyzeScope(agreement, 'Please add a blog.').status).toBe('needs-review')
  })
  it.each(['Blog and booking systems were not included.', 'Blog and booking systems have not been included.'])('shares a passive exclusion only across the noun list: %s', agreement => {
    const result = analyzeScope(agreement, 'Add a blog; add a booking system.')
    expect(result.tasks?.map(t => t.verdict)).toEqual(['potential-change', 'potential-change'])
  })
  it('keeps a past exclusion conflicting with a current inclusion under review', () => {
    expect(analyzeScope("Blog wasn't included. Blog is included.", 'Please add a blog.').status).toBe('needs-review')
  })
})
