import { describe, expect, it } from 'vitest'
import { analyzeScope } from './analysis-engine'

describe('v0.9 explicit exclusions and real requests', () => {
  it.each(['blog', 'newsletter', 'inventory tracker', 'loyalty portal'])('surfaces excluded %s with evidence and a specific reply', capability => {
    const result = analyzeScope(`Build a landing page. ${capability} is not included.`, `Please add a ${capability} with a page for each article.`)
    expect(result.status).toBe('potential-change')
    expect(result.tasks?.[0].agreementEvidence).toContain('not included')
    expect(result.reply.toLowerCase()).toContain(capability)
  })
  it('assesses a 50K mixed request task by task', () => {
    const agreement = 'General terms apply. '.repeat(2600) + ' Homepage text revisions included. Gallery photo replacement included. Newsletter excluded.'
    const result = analyzeScope(agreement, 'Update homepage text; replace gallery photos; add a newsletter.')
    expect(result.tasks?.map(t => t.verdict)).toEqual(['likely-covered', 'likely-covered', 'potential-change'])
    expect(result.tasks?.[2].agreementEvidence).toContain('Newsletter excluded')
  })
  it.each(['If we expand, add a newsletter.', 'The example says "add a newsletter".', 'Maybe add a newsletter.', "The example says 'add a newsletter'.", 'Assuming we expand, add a newsletter.', 'Do not add a newsletter.'])('preserves qualified unknown requests: %s', request => {
    expect(analyzeScope('Newsletter excluded.', request).status).toBe('needs-review')
  })
  it.each(['Newsletter optional.', 'Newsletter may be excluded.', 'Newsletter included. Newsletter excluded.', 'Newsletter is not excluded.'])('requires review for uncertain or conflicting agreement: %s', agreement => {
    expect(analyzeScope(agreement, 'Add a newsletter.').status).toBe('needs-review')
  })
  it.each(['No newsletter.', 'Newsletter and inventory tracker are excluded.', "Newsletter isn't included.", 'Exclusions: newsletter.'])('recognizes bounded unknown exclusions: %s', agreement => {
    const result = analyzeScope(agreement, 'Add a newsletter.')
    expect(result.status).toBe('potential-change')
    expect(result.tasks?.[0].agreementEvidence).toBeTruthy()
  })
  it('recognizes an explicitly included unknown capability', () => {
    expect(analyzeScope('Newsletter included.', 'Add a newsletter.').tasks?.[0].verdict).toBe('likely-covered')
  })
  it('does not promote an agreement example to a binding exclusion', () => {
    expect(analyzeScope('Example: “Newsletter excluded”.', 'Add a newsletter.').status).toBe('needs-review')
  })
  it('separates unknown included and excluded subjects in one sentence', () => {
    const result = analyzeScope('Newsletter included and inventory tracker excluded.', 'Add a newsletter; add an inventory tracker.')
    expect(result.tasks?.map(t => t.verdict)).toEqual(['likely-covered', 'potential-change'])
  })
  it('does not match an unrelated noun in an exclusion', () => {
    expect(analyzeScope('Newsletter design excluded.', 'Add a design gallery.').status).toBe('needs-review')
  })
  it('treats a blog link as a modification', () => {
    expect(analyzeScope('Blog excluded.', 'Add a blog link.').status).toBe('needs-review')
  })
})
