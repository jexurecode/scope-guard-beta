import { describe, expect, it } from 'vitest'
import { analyzeScope } from './analysis-engine'
import { assessClientTasks, MAX_TASKS, splitClientTasks } from './task-analysis'
import { importScopeDocument } from './document-import'
import { LIMITS, validateInputs } from './workspace'
import { isAnalysis } from './hybrid-provider'

const contract = 'Project includes two rounds of homepage copy edits and gallery image replacement. We will deliver a contact form. Customer booking systems are excluded from this contract.'
const mixed = '1. Update homepage copy.\n2. Replace gallery images.\n3. Add a customer booking system.'

describe('v0.8 feedback acceptance: mixed-scope requests', () => {
  it('splits numbered lists, bullets, and action clauses without inventing tasks', () => {
    expect(splitClientTasks(mixed)).toHaveLength(3)
    expect(splitClientTasks('Update homepage text, replace gallery photos, and add a booking system.')).toHaveLength(3)
    expect(splitClientTasks('Add an online store with Stripe payments.')).toHaveLength(1)
  })
  it('shows two likely covered tasks and one potential change with agreement evidence', () => {
    const result = analyzeScope(contract, mixed)
    expect(result.status).toBe('potential-change')
    expect(result.tasks?.map(t => t.verdict)).toEqual(['likely-covered', 'likely-covered', 'potential-change'])
    expect(result.tasks?.[2].agreementEvidence).toMatch(/excluded/i)
    expect(result.reply).toMatch(/booking|scope/i)
    expect(isAnalysis(result)).toBe(true)
  })
  it('does not fabricate within-scope evidence when agreement is too vague', () => {
    const { tasks } = assessClientTasks('Create an awesome website.', 'Update homepage copy.')
    expect(tasks[0].verdict).toBe('needs-review')
    expect(tasks[0].agreementEvidence).toBeUndefined()
  })
  it('flags an explicitly excluded custom deliverable beyond the feature catalog', () => {
    const result = analyzeScope('Excluded: custom analytics export reports. Includes basic homepage edits.', 'Add custom analytics export reports.')
    expect(result.tasks?.[0].verdict).toBe('potential-change')
    expect(result.tasks?.[0].agreementEvidence).toMatch(/excluded/i)
  })
  it.each([
    'Maybe add booking.',
    'Could we discuss payments?',
    'Add a Stripe logo.',
    'Add a link to the online store.',
    'Add text explaining payments.',
    'Replace payments with booking.',
    'The client said "add payments".',
  ])('does not upgrade non-additions into scope changes: %s', request => {
    const result = analyzeScope('Build a five-page business website with a contact form.', request)
    expect(result.status).toBe('needs-review')
    expect(result.tasks?.every(task => task.verdict === 'needs-review')).toBe(true)
  })
  it('keeps original rules for negative requests', () => {
    const result = analyzeScope('Build a simple website. No bookings.', 'Do not add bookings.')
    expect(result.detectedChanges).toEqual([])
  })
  it('does not silently ignore additional tasks over the limit', () => {
    const request = Array.from({length: MAX_TASKS + 3}, (_, i) => `- Update section ${i + 1}`).join('\n')
    const { tasks, omitted } = assessClientTasks(contract, request)
    expect(tasks).toHaveLength(MAX_TASKS)
    expect(omitted).toBe(3)
    expect(analyzeScope(contract, request).reviewNotes?.join(' ')).toMatch(/3 additional client task/i)
  })
  it('supports a 50k+ character contract without chopping exclusions', () => {
    const longAgreement = 'Schedule and definitions. '.repeat(2500) + contract
    expect(longAgreement.length).toBeGreaterThan(50000)
    expect(validateInputs(longAgreement, mixed)).toBeNull()
    const result = analyzeScope(longAgreement, mixed)
    expect(result.tasks?.map(t => t.verdict)).toEqual(['likely-covered', 'likely-covered', 'potential-change'])
  })
  it('preserves limits rather than accepting unlimited input', () => {
    expect(LIMITS.agreement).toBeGreaterThan(50000)
    expect(validateInputs('a'.repeat(LIMITS.agreement + 1), 'request')).toMatch(/Shorten/)
  })
})

describe('v0.8 local document imports', () => {
  it('imports plain UTF-8 text locally with no truncation', async () => {
    const file = new File(['Agreement includes a contact form.'], 'contract.txt', {type: 'text/plain'})
    const imported = await importScopeDocument(file, 'agreement')
    expect(imported.text).toContain('contact form')
    expect(imported.warnings).toEqual([])
  })
  it('rejects unsupported and oversized files without silently importing partial text', async () => {
    await expect(importScopeDocument(new File(['<html/>'], 'contract.html'), 'agreement')).rejects.toThrow(/PDF, DOCX/)
    await expect(importScopeDocument(new File(['x'.repeat(LIMITS.request + 1)], 'request.txt'), 'request')).rejects.toThrow(/limit/)
  })
})
