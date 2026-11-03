import type { SavedAnalysis } from '../types/workspace'

export const READ_KEY = 'scope-guard-notifications-read-v1'
const MAX_STORED = 500

export function loadReadIds(): string[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(READ_KEY) || '[]')
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : []
  } catch {
    return []
  }
}

export function saveReadIds(ids: readonly string[]): void {
  try { localStorage.setItem(READ_KEY, JSON.stringify(ids.slice(-MAX_STORED))) } catch { /* storage may be disabled */ }
}

/** Adds ids to the read list without duplicates, dropping ids of analyses that no longer exist. */
export function addRead(current: readonly string[], ids: readonly string[], analyses: readonly SavedAnalysis[]): string[] {
  const existing = new Set(analyses.map(a => a.id))
  return [...new Set([...current, ...ids])].filter(id => existing.has(id))
}

export function unreadAnalyses(analyses: readonly SavedAnalysis[], read: ReadonlySet<string>): SavedAnalysis[] {
  return analyses.filter(a => !read.has(a.id))
}
