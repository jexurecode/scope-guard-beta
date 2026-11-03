import { afterEach, describe, expect, it, vi } from 'vitest'
import type { SavedAnalysis } from '../types/workspace'
import { addRead, loadReadIds, READ_KEY, saveReadIds, unreadAnalyses } from './notifications'

afterEach(() => vi.unstubAllGlobals())

const item = (id: string): SavedAnalysis => ({ id, projectId: 'p', createdAt: '2026-01-01T00:00:00.000Z', agreement: 'a', request: 'r', result: { status: 'needs-review', title: 't', explanation: 'e', reply: 'r', detectedChanges: [] } })

describe('read state', () => {
  it('computes unread analyses', () => {
    expect(unreadAnalyses([item('1'), item('2'), item('3')], new Set(['2'])).map(a => a.id)).toEqual(['1', '3'])
  })
  it('adds ids without duplicates and drops ids of deleted analyses', () => {
    const analyses = [item('1'), item('2')]
    expect(addRead(['1'], ['1', '2'], analyses)).toEqual(['1', '2'])
    expect(addRead(['gone', '1'], ['2'], analyses)).toEqual(['1', '2'])
  })
})

describe('persistence', () => {
  it('tolerates missing, malformed, and mixed stored data', () => {
    for (const [stored, expected] of [[null, []], ['not json', []], ['{"a":1}', []], ['["a",1,"b"]', ['a', 'b']]] as const) {
      vi.stubGlobal('localStorage', { getItem: (key: string) => (key === READ_KEY ? stored : null) })
      expect(loadReadIds()).toEqual(expected)
    }
  })
  it('keeps only the most recent 500 ids and survives unavailable storage', () => {
    let saved = ''
    vi.stubGlobal('localStorage', { setItem: (_: string, value: string) => { saved = value } })
    saveReadIds(Array.from({ length: 600 }, (_, i) => `id${i}`))
    expect(JSON.parse(saved)).toHaveLength(500)
    expect(JSON.parse(saved)[499]).toBe('id599')
    vi.stubGlobal('localStorage', { setItem: () => { throw new Error('full') } })
    expect(() => saveReadIds(['a'])).not.toThrow()
  })
})
