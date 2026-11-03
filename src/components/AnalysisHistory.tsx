import { Inbox } from 'lucide-react'
import type { SavedAnalysis } from '../types/workspace'
import { AnalysisRow } from './AnalysisRow'
import { EmptyState } from './EmptyState'

type Props = {
  items: SavedAnalysis[]
  activeId?: string
  onOpen: (id: string) => void
  projectNames?: Record<string, string>
}

export function AnalysisHistory({ items, activeId, onOpen, projectNames }: Props) {
  return (
    <section aria-labelledby="history-heading">
      <h3 id="history-heading" className="sr-only">Analysis history</h3>
      {!items.length ? (
        <EmptyState icon={Inbox} title="No analyses yet">Your first analysis will appear here. Open a saved one to review its agreement snapshot and edit its reply.</EmptyState>
      ) : (
        <ul className="divide-y divide-line">
          {items.map(item => <li key={item.id} className="py-1"><AnalysisRow item={item} projectName={projectNames?.[item.projectId]} active={activeId === item.id} onOpen={onOpen} /></li>)}
        </ul>
      )}
    </section>
  )
}
