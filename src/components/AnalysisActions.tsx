import { RotateCcw, Sparkles } from 'lucide-react'

type Props = { canAnalyze: boolean; loading: boolean; handleAnalyze: () => void; loadExample: () => void; showExample?: boolean; reset: () => void }

export function AnalysisActions({ canAnalyze, loading, handleAnalyze, loadExample, showExample = true, reset }: Props) {
  return (
    <div className="mt-5 flex flex-wrap items-center gap-3">
      <button type="button" onClick={handleAnalyze} disabled={!canAnalyze} className="btn btn-primary px-6">
        <Sparkles size={17} aria-hidden="true" />
        {loading ? 'Analyzing...' : 'Analyze scope'}
      </button>
      {showExample && <button type="button" onClick={loadExample} className="btn btn-secondary">View sample analysis</button>}
      <button type="button" onClick={reset} className="btn text-muted hover:text-fg">
        <RotateCcw size={16} aria-hidden="true" />
        New request
      </button>
    </div>
  )
}
