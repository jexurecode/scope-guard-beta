import type { Analysis } from '../types/analysis'
import { heuristicProvider, type AnalysisInput, type AnalysisProvider } from './analysis-provider'
import { LIMITS, validateInputs } from './workspace'

export type EngineUsed = 'rules' | 'mock-ai' | 'rules-fallback'
export type HybridResult = { analysis: Analysis; engineUsed: EngineUsed; fallbackReason?: string }

/** Deterministic simulation, not a real model. Never sends user data to a server. */
export const mockAiProvider: AnalysisProvider = {
  async analyze(input) {
    const error = validateInputs(input.agreement, input.request)
    if (error) throw new Error(error)
    // Reuse the real heuristic for realistic UI integration, not pretend to have AI accuracy.
    return heuristicProvider.analyze(input)
  },
}

export function isAnalysis(value: unknown): value is Analysis {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  if (v.status !== 'potential-change' && v.status !== 'needs-review') return false
  if (typeof v.title !== 'string' || v.title.length > 300 || typeof v.explanation !== 'string' || v.explanation.length > 10000 || typeof v.reply !== 'string' || v.reply.length > LIMITS.reply) return false
  if (!Array.isArray(v.detectedChanges) || v.detectedChanges.length > 40) return false
  if (!v.detectedChanges.every(c => c && typeof c === 'object' && typeof c.feature === 'string' && c.feature.length <= 200 && typeof c.requestEvidence === 'string' && c.requestEvidence.length <= 1000 && typeof c.explanation === 'string' && c.explanation.length <= 5000)) return false
  if (v.reviewNotes !== undefined && !(Array.isArray(v.reviewNotes) && v.reviewNotes.length <= 40 && v.reviewNotes.every(n => typeof n === 'string' && n.length <= 2000))) return false
  return v.tasks === undefined || (Array.isArray(v.tasks) && v.tasks.length <= 24 && v.tasks.every(t => t && typeof t === 'object' && typeof t.task === 'string' && t.task.length <= LIMITS.request && ['potential-change','likely-covered','needs-review'].includes(t.verdict) && typeof t.explanation === 'string' && t.explanation.length <= 2000 && typeof t.requestEvidence === 'string' && t.requestEvidence.length <= 1000 && (t.agreementEvidence === undefined || (typeof t.agreementEvidence === 'string' && t.agreementEvidence.length <= 350))))
}

export async function analyzeHybrid(input: AnalysisInput, primary: AnalysisProvider = mockAiProvider, fallback: AnalysisProvider = heuristicProvider): Promise<HybridResult> {
  const error = validateInputs(input.agreement, input.request)
  if (error) throw new Error(error)
  try {
    const analysis = await primary.analyze(input)
    if (!isAnalysis(analysis)) throw new Error('Invalid provider response')
    return { analysis, engineUsed: 'mock-ai' }
  } catch {
    const analysis = await fallback.analyze(input)
    if (!isAnalysis(analysis)) throw new Error('Invalid fallback response')
    return { analysis, engineUsed: 'rules-fallback', fallbackReason: 'Mock provider unavailable or returned invalid output.' }
  }
}
