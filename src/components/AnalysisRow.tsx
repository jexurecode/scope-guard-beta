import { ChevronRight, Clock3 } from 'lucide-react'
import type { SavedAnalysis } from '../types/workspace'
import { formatDateTime, timeAgo } from '../lib/format'
import { StatusBadge } from './StatusBadge'

type Props = { item: SavedAnalysis; projectName?: string; active?: boolean; onOpen: (id: string) => void }

export function AnalysisRow({ item, projectName, active = false, onOpen }: Props) {
  const when = timeAgo(item.createdAt)
  return (
    <button
      type="button"
      onClick={() => onOpen(item.id)}
      aria-current={active ? 'true' : undefined}
      className={`analysis-row flex w-full items-start gap-3 rounded-xl border px-3 py-3 text-left transition-colors sm:items-center sm:px-4 ${active ? 'border-brand-500 bg-tint' : 'border-transparent hover:bg-tint'}`}
    >
      <span className="icon-tile mt-0.5 sm:mt-0"><Clock3 size={18} aria-hidden="true" /></span>
      <span className="min-w-0 flex-1">
        <span className="row-request block truncate text-sm font-semibold text-fg">{item.request}</span>
        <span className="mt-0.5 block truncate text-xs text-muted">{projectName ?? 'Saved project'}<span className="row-mobile-time sm:hidden"> · {when}</span></span>
        <span className="row-status-mobile mt-2 flex sm:hidden"><StatusBadge status={item.result.status} /></span>
      </span>
      <span className="row-status-desktop hidden shrink-0 sm:block"><StatusBadge status={item.result.status} /></span>
      <time dateTime={item.createdAt} title={formatDateTime(item.createdAt)} className="hidden w-24 shrink-0 text-right text-xs text-muted sm:block">{when}</time>
      <ChevronRight size={17} aria-hidden="true" className="mt-2.5 shrink-0 text-muted sm:mt-0" />
    </button>
  )
}
