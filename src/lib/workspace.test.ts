import { afterEach, describe, expect, it, vi } from 'vitest'
import { analyzeScope } from './analysis-engine'
import { createSavedAnalysis, emptyWorkspace, isWorkspace, LIMITS, loadWorkspace, removeProject, saveWorkspace, validateInputs, WORKSPACE_KEY } from './workspace'
import type { Workspace } from '../types/workspace'

function fixture(): Workspace {
  return {
    version: 1,
    projects: [
      { id: 'a', name: 'Website', agreement: 'Current agreement with booking.' },
      { id: 'b', name: 'Portfolio', agreement: 'Portfolio design.' },
    ],
    analyses: [{ id: 'analysis-a', projectId: 'a', createdAt: '2026-10-29T12:00:00.000Z', agreement: 'Original website agreement.', request: 'Add booking.', result: { ...analyzeScope('Original website agreement.', 'Add booking.'), reply: 'My edited response.' } }],
  }
}
afterEach(() => vi.unstubAllGlobals())

describe('local workspace persistence', () => {
  it('starts empty for a new browser without writing storage', () => {
    const setItem = vi.fn()
    vi.stubGlobal('localStorage', { getItem: () => null, setItem })
    expect(loadWorkspace()).toEqual({ data: emptyWorkspace(), error: null })
    expect(setItem).not.toHaveBeenCalled()
  })
  it('round trips project agreements, history snapshots, and edited responses', () => {
    const store = new Map<string, string>()
    vi.stubGlobal('localStorage', { getItem: (key: string) => store.get(key) ?? null, setItem: (key: string, value: string) => store.set(key, value) })
    const data = fixture()
    expect(saveWorkspace(data)).toBeNull()
    expect(store.has(WORKSPACE_KEY)).toBe(true)
    expect(loadWorkspace()).toEqual({ data, error: null })
    expect(loadWorkspace().data.analyses[0].agreement).not.toBe(data.projects[0].agreement)
    expect(loadWorkspace().data.analyses[0].result.reply).toBe('My edited response.')
  })
  it.each(['{broken', 'null', '{"version":2,"projects":[],"analyses":[]}', '{"version":1,"projects":null,"analyses":[]}'])('rejects unreadable storage without overwriting it: %s', raw => {
    const setItem = vi.fn()
    vi.stubGlobal('localStorage', { getItem: () => raw, setItem })
    expect(loadWorkspace().error).toBeTruthy()
    expect(setItem).not.toHaveBeenCalled()
  })
  it('handles storage access failure', () => {
    vi.stubGlobal('localStorage', { getItem: () => { throw new Error('Blocked') } })
    expect(loadWorkspace().error).toBeTruthy()
  })
  it('reports a failed save and allows a later retry', () => {
    const setItem = vi.fn().mockImplementationOnce(() => { throw new Error('Quota exceeded') })
    vi.stubGlobal('localStorage', { setItem })
    expect(saveWorkspace(fixture())).toContain('only in memory')
    expect(saveWorkspace(fixture())).toBeNull()
  })
  it('rejects orphaned history, duplicate IDs, invalid dates, and malformed results', () => {
    const orphan = fixture(); orphan.analyses[0].projectId = 'missing'
    const duplicate = fixture(); duplicate.projects.push(duplicate.projects[0])
    const duplicateHistory = fixture(); duplicateHistory.analyses.push(duplicateHistory.analyses[0])
    const date = fixture(); date.analyses[0].createdAt = 'invalid'
    const malformed = fixture(); Object.assign(malformed.analyses[0].result, { detectedChanges: [null] })
    for (const data of [orphan, duplicate, duplicateHistory, date, malformed]) expect(isWorkspace(data)).toBe(false)
  })
  it('deletes only the selected project and its history without mutating the original', () => {
    const data = fixture()
    const next = removeProject(data, 'a')
    expect(next.projects.map(p => p.id)).toEqual(['b'])
    expect(next.analyses).toEqual([])
    expect(data.projects).toHaveLength(2)
    expect(data.analyses).toHaveLength(1)
    expect(isWorkspace(next)).toBe(true)
  })
})

describe('input validation', () => {
  it.each([['', 'request'], ['agreement', '  '], ['  ', 'request']])('rejects missing text', (agreement, request) => {
    expect(validateInputs(agreement, request)).toContain('Enter both')
  })
  it('accepts the boundaries and rejects oversized inputs', () => {
    expect(validateInputs('a'.repeat(LIMITS.agreement), 'r'.repeat(LIMITS.request))).toBeNull()
    expect(validateInputs('a'.repeat(LIMITS.agreement + 1), 'request')).toContain('Shorten')
    expect(validateInputs('agreement', 'r'.repeat(LIMITS.request + 1))).toContain('Shorten')
  })
})

describe('saved analysis creation', () => {
  it('captures the inputs and delegates to the existing heuristic engine', () => {
    const saved = createSavedAnalysis('project-1', 'Build a simple website.', 'Add booking.')
    expect(saved.projectId).toBe('project-1')
    expect(saved.agreement).toBe('Build a simple website.')
    expect(saved.request).toBe('Add booking.')
    expect(saved.result).toEqual(analyzeScope(saved.agreement, saved.request))
    expect(Number.isFinite(Date.parse(saved.createdAt))).toBe(true)
    expect(saved.id).not.toBe(createSavedAnalysis('project-1', saved.agreement, saved.request).id)
  })
  it('rejects invalid inputs before creating history', () => {
    expect(() => createSavedAnalysis('p', '', 'Add booking.')).toThrow('Enter both')
  })
})

describe('history compatibility with context-aware results', () => {
  it('accepts legacy results without review notes without recomputing their replies', () => {
    const legacy = fixture()
    delete legacy.analyses[0].result.reviewNotes
    vi.stubGlobal('localStorage', { getItem: () => JSON.stringify(legacy) })
    expect(loadWorkspace()).toEqual({ data: legacy, error: null })
    expect(loadWorkspace().data.analyses[0].result.reply).toBe('My edited response.')
  })
  it('preserves new review notes through storage', () => {
    const data = fixture()
    data.analyses[0].result = analyzeScope('Website.', "Don't add payments, but add booking.")
    let stored = ''
    vi.stubGlobal('localStorage', { setItem: (_key: string, value: string) => { stored = value }, getItem: () => stored })
    expect(saveWorkspace(data)).toBeNull()
    expect(loadWorkspace().data.analyses[0].result).toEqual(data.analyses[0].result)
  })
  it.each([null, 'invalid', [1], [{}]])('rejects malformed optional notes: %s', notes => {
    const data = fixture()
    Object.assign(data.analyses[0].result, { reviewNotes: notes })
    expect(isWorkspace(data)).toBe(false)
  })
  it('uses a supplied provider result without reanalyzing the snapshot', () => {
    const result = analyzeScope('Website.', 'Maybe add booking.')
    const saved = createSavedAnalysis('p', 'Website.', 'Add booking.', result)
    expect(saved.result).toBe(result)
    expect(saved.request).toBe('Add booking.')
  })
})
