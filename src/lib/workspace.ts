import { analyzeScope } from './analysis-engine'
import type { Analysis } from '../types/analysis'
import type { SavedAnalysis } from '../types/workspace'
import type { Workspace } from '../types/workspace'

export const LIMITS = { name: 80, agreement: 20000, request: 5000, reply: 10000 } as const
export const WORKSPACE_KEY = 'scope-guard-workspace-v1'
export const emptyWorkspace = (): Workspace => ({ version: 1, projects: [], analyses: [] })

export function validateInputs(agreement: string, request: string): string | null {
  if (!agreement.trim() || !request.trim()) return 'Enter both an original agreement and a client request.'
  if (agreement.length > LIMITS.agreement || request.length > LIMITS.request) return 'Shorten the text to fit the character limits.'
  return null
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
function text(value: unknown, max: number): value is string {
  return typeof value === 'string' && value.length <= max
}
export function isWorkspace(value: unknown): value is Workspace {
  if (!record(value) || value.version !== 1 || !Array.isArray(value.projects) || !Array.isArray(value.analyses)) return false
  const ids = new Set<string>()
  for (const p of value.projects) {
    if (!record(p) || typeof p.id !== 'string' || !p.id || ids.has(p.id) || !text(p.name, LIMITS.name) || !p.name.trim() || !text(p.agreement, LIMITS.agreement)) return false
    ids.add(p.id)
  }
  const historyIds = new Set<string>()
  for (const a of value.analyses) {
    if (!record(a) || typeof a.id !== 'string' || !a.id || historyIds.has(a.id) || typeof a.projectId !== 'string' || !ids.has(a.projectId) || typeof a.createdAt !== 'string' || !Number.isFinite(Date.parse(a.createdAt)) || !text(a.agreement, LIMITS.agreement) || !text(a.request, LIMITS.request)) return false
    const r = a.result
    if (!record(r) || !['potential-change', 'needs-review'].includes(String(r.status)) || typeof r.title !== 'string' || typeof r.explanation !== 'string' || !text(r.reply, LIMITS.reply) || !Array.isArray(r.detectedChanges)) return false
    if (!r.detectedChanges.every(c => record(c) && typeof c.feature === 'string' && typeof c.requestEvidence === 'string' && typeof c.explanation === 'string')) return false
    if (r.reviewNotes !== undefined && (!Array.isArray(r.reviewNotes) || !r.reviewNotes.every(note => typeof note === 'string'))) return false
    historyIds.add(a.id)
  }
  return true
}

export function loadWorkspace(): { data: Workspace; error: string | null } {
  try {
    const raw = localStorage.getItem(WORKSPACE_KEY)
    if (raw === null) return { data: emptyWorkspace(), error: null }
    const data: unknown = JSON.parse(raw)
    if (!isWorkspace(data)) throw new Error('Invalid workspace')
    return { data, error: null }
  } catch {
    return { data: emptyWorkspace(), error: 'Saved workspace could not be read. Existing storage has not been overwritten. Reload to retry, or explicitly replace the saved workspace.' }
  }
}

export function saveWorkspace(data: Workspace): string | null {
  try {
    localStorage.setItem(WORKSPACE_KEY, JSON.stringify(data))
    return null
  } catch {
    return 'Changes are only in memory: browser storage is unavailable or full. Keep this tab open and retry saving.'
  }
}

export function removeProject(data: Workspace, id: string): Workspace {
  return { ...data, projects: data.projects.filter(p => p.id !== id), analyses: data.analyses.filter(a => a.projectId !== id) }
}

export function createSavedAnalysis(projectId: string, agreement: string, request: string, result?: Analysis): SavedAnalysis {
  const error = validateInputs(agreement, request)
  if (error) throw new Error(error)
  return {
    id: crypto.randomUUID(),
    projectId,
    createdAt: new Date().toISOString(),
    agreement,
    request,
    result: result ?? analyzeScope(agreement, request),
  }
}
