import { describe, expect, it } from 'vitest'
import type { SavedAnalysis, Workspace } from '../types/workspace'
import { searchWorkspace } from './search'

const analysis = (id: string, projectId: string, request: string, status: 'potential-change' | 'needs-review' = 'potential-change'): SavedAnalysis => ({
  id, projectId, createdAt: '2026-01-01T10:00:00.000Z', agreement: 'Five page website.', request,
  result: { status, title: 'T', explanation: 'E', reply: 'R', detectedChanges: [] },
})
const data: Workspace = {
  version: 1,
  projects: [
    { id: 'a', name: 'Cafe site', agreement: 'Five page website with a contact form.' },
    { id: 'b', name: 'Gym app', agreement: 'Mobile app. The Cafe site team supplies the logo.' },
  ],
  analyses: [
    analysis('1', 'a', 'Please add an online store with Stripe payments.'),
    analysis('2', 'b', 'The layout looks great, can we tweak it?', 'needs-review'),
  ],
}

describe('searchWorkspace', () => {
  it('returns nothing for an empty or blank query', () => {
    expect(searchWorkspace(data, '')).toEqual([])
    expect(searchWorkspace(data, '   ')).toEqual([])
  })
  it('finds projects and analyses case-insensitively', () => {
    const hits = searchWorkspace(data, 'STRIPE')
    expect(hits).toHaveLength(1)
    expect(hits[0]).toMatchObject({ type: 'analysis', id: '1', detail: 'Analysis · Cafe site' })
  })
  it('requires every term to match', () => {
    expect(searchWorkspace(data, 'online store').map(h => h.id)).toEqual(['1'])
    expect(searchWorkspace(data, 'online nonexistent')).toEqual([])
  })
  it('lists a project whose name matches before one that only mentions the term', () => {
    const hits = searchWorkspace(data, 'cafe').filter(h => h.type === 'project')
    expect(hits.map(h => h.id)).toEqual(['a', 'b'])
  })
  it('matches the project name and status label of an analysis', () => {
    expect(searchWorkspace(data, 'gym').some(h => h.type === 'analysis' && h.id === '2')).toBe(true)
    expect(searchWorkspace(data, 'manual review').map(h => h.id)).toEqual(['2'])
  })
  it('caps the number of results', () => {
    expect(searchWorkspace(data, 'a', 2)).toHaveLength(2)
  })
})
