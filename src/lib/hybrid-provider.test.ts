import { describe, expect, it } from 'vitest'
import { analyzeHybrid, isAnalysis, mockAiProvider } from './hybrid-provider'
import { heuristicProvider, type AnalysisProvider } from './analysis-provider'

const input = { agreement: 'Build a portfolio with About and Contact.', request: 'Add an admin dashboard to edit website content.' }
describe('hybrid mock wiring', () => {
  it('uses local deterministic simulation without changing analysis', async () => {
    const result = await analyzeHybrid(input)
    expect(result.engineUsed).toBe('mock-ai')
    expect(result.analysis).toEqual(await heuristicProvider.analyze(input))
    expect(await mockAiProvider.analyze(input)).toEqual(result.analysis)
  })
  it('falls back when provider throws', async () => {
    const failing: AnalysisProvider = { analyze: async () => { throw new Error('offline') } }
    const result = await analyzeHybrid(input, failing)
    expect(result.engineUsed).toBe('rules-fallback')
    expect(result.analysis).toEqual(await heuristicProvider.analyze(input))
  })
  it('rejects malformed primary responses and falls back', async () => {
    const malformed: AnalysisProvider = { analyze: async () => ({ status: 'wrong' }) as never }
    expect((await analyzeHybrid(input, malformed)).engineUsed).toBe('rules-fallback')
    expect(isAnalysis({ status: 'needs-review', title: '', explanation: '', reply: '', detectedChanges: [{ feature: 1 }] })).toBe(false)
  })
  it('validates inputs before calling providers', async () => {
    await expect(analyzeHybrid({ agreement: '', request: 'test' })).rejects.toThrow()
  })
})
