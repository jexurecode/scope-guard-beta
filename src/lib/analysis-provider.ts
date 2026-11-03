import type { Analysis } from '../types/analysis'
import { analyzeScope } from './analysis-engine'

export type AnalysisInput = { agreement: string; request: string }

// A future backend adapter can implement this boundary. Credentials must stay
// on that backend; the current adapter performs no network requests.
export interface AnalysisProvider {
  analyze(input: AnalysisInput): Promise<Analysis>
}

export const heuristicProvider: AnalysisProvider = {
  async analyze({ agreement, request }) {
    return analyzeScope(agreement, request)
  },
}
