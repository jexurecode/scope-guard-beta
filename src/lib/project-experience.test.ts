import { describe, expect, it } from 'vitest'
import { agreementPreview, duplicateProject } from './project-experience'
import { createSavedAnalysis, isWorkspace } from './workspace'

describe('project experience and preservation', () => {
  it('finds duplicate names ignoring case and surrounding spaces, without merging', () => {
    const projects = [{ id: '1', name: 'Acme Site', agreement: 'Original' }]
    expect(duplicateProject(projects, '  ACME SITE ')).toBe(projects[0])
    expect(duplicateProject(projects, 'Acme second engagement')).toBeUndefined()
    expect(projects).toHaveLength(1)
  })
  it('bounds the preview while preserving the complete 50K agreement and history snapshot', () => {
    const agreement = 'Contract terms. '.repeat(3300) + 'Newsletter excluded.'
    const project = { id: 'p', name: 'Client', agreement }
    expect(agreementPreview(agreement)).toHaveLength(175)
    expect(agreementPreview(agreement)).toMatch(/…$/)
    const saved = createSavedAnalysis('p', agreement, 'Add a newsletter.')
    const restored = JSON.parse(JSON.stringify({ version: 1, projects: [project], analyses: [saved] }))
    expect(isWorkspace(restored)).toBe(true)
    expect(restored.projects[0].agreement).toBe(agreement)
    expect(restored.analyses[0].agreement).toBe(agreement)
    expect(restored.analyses[0].result.tasks[0].agreementEvidence).toBe('Newsletter excluded')
  })
})
