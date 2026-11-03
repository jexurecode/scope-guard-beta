import type { Workspace } from '../types/workspace'
import { STATUS_LABEL } from './format'

export type SearchHit = { type: 'project' | 'analysis'; id: string; title: string; detail: string }

/** Every whitespace-separated term must appear somewhere in the item's searchable text. */
function matches(haystack: string, terms: readonly string[]): boolean {
  const text = haystack.toLowerCase()
  return terms.every(term => text.includes(term))
}

export function searchWorkspace(data: Workspace, query: string, limit = 12): SearchHit[] {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  if (!terms.length) return []
  const names = new Map(data.projects.map(p => [p.id, p.name]))

  const projects = data.projects
    .filter(p => matches(`${p.name} ${p.agreement}`, terms))
    // Name matches first, so typing a project name lists it before agreements that merely mention it.
    .sort((a, b) => Number(matches(b.name, terms)) - Number(matches(a.name, terms)))
    .map((p): SearchHit => ({ type: 'project', id: p.id, title: p.name, detail: 'Project' }))

  const analyses = data.analyses
    .filter(a => matches(`${a.request} ${a.agreement} ${names.get(a.projectId) ?? ''} ${STATUS_LABEL[a.result.status]}`, terms))
    .map((a): SearchHit => ({ type: 'analysis', id: a.id, title: a.request.slice(0, 90), detail: `Analysis · ${names.get(a.projectId) ?? 'Project'}` }))

  return [...projects, ...analyses].slice(0, limit)
}
