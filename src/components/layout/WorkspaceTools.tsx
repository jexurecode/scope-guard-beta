import { useEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent } from 'react'
import { Bell, Search, X } from 'lucide-react'
import type { NotificationReads } from '../../hooks/useNotificationReads'
import { STATUS_LABEL, timeAgo } from '../../lib/format'
import type { View } from '../../lib/navigation'
import { unreadAnalyses } from '../../lib/notifications'
import { searchWorkspace } from '../../lib/search'
import type { SearchHit } from '../../lib/search'
import type { Workspace } from '../../types/workspace'

type Props = {
  data: Workspace
  notifications: NotificationReads
  onNavigate: (view: View) => void
  onOpenAnalysis: (id: string) => void
  onSelectProject: (id: string) => void
}

/** On phones the panels span the screen under the header; from `sm` up they hang below their button. */
const PANEL = 'fixed inset-x-3 top-[calc(4rem+env(safe-area-inset-top))] z-40 rounded-xl border border-line bg-surface p-3 shadow-xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2'

export function WorkspaceTools({ data, notifications, onNavigate, onOpenAnalysis, onSelectProject }: Props) {
  const toolsRef = useRef<HTMLDivElement>(null)
  const searchButton = useRef<HTMLButtonElement>(null)
  const bellButton = useRef<HTMLButtonElement>(null)
  const [panel, setPanel] = useState<'search' | 'bell' | null>(null)
  const [query, setQuery] = useState('')
  const projectNames = useMemo(() => new Map(data.projects.map(p => [p.id, p.name])), [data.projects])
  const results = useMemo(() => searchWorkspace(data, query), [data, query])
  const unread = unreadAnalyses(data.analyses, notifications.read)

  useEffect(() => {
    if (!panel) return
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !toolsRef.current?.contains(event.target)) setPanel(null)
    }
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setPanel(null)
      // Return focus to the control that opened the panel.
      const trigger = panel === 'search' ? searchButton : bellButton
      trigger.current?.focus()
    }
    document.addEventListener('pointerdown', outside)
    document.addEventListener('keydown', escape)
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape) }
  }, [panel])

  const openResult = (hit: SearchHit) => {
    if (hit.type === 'analysis') onOpenAnalysis(hit.id)
    else { onSelectProject(hit.id); onNavigate('project') }
    setPanel(null)
    setQuery('')
  }
  const openNotification = (id: string) => {
    notifications.markRead([id])
    onOpenAnalysis(id)
    setPanel(null)
  }

  /** Arrow keys move between the search field and its results; Enter in the field opens the first result. */
  const onSearchKeys = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
    const items = [...event.currentTarget.querySelectorAll<HTMLElement>('[data-nav]')]
    const index = items.indexOf(document.activeElement as HTMLElement)
    const next = items[event.key === 'ArrowDown' ? Math.min(index + 1, items.length - 1) : Math.max(index - 1, 0)]
    if (next) { event.preventDefault(); next.focus() }
  }

  return (
    <div ref={toolsRef} className="relative flex items-center gap-2">
      <button ref={searchButton} type="button" aria-label="Search workspace" aria-expanded={panel === 'search'} onClick={() => setPanel(p => p === 'search' ? null : 'search')} className="btn btn-secondary px-3 sm:px-4">
        <Search size={18} aria-hidden="true" /><span className="hidden xl:inline">Search projects, analyses...</span>
      </button>
      <button ref={bellButton} type="button" aria-label={`Activity notifications, ${unread.length} unread`} aria-expanded={panel === 'bell'} onClick={() => setPanel(p => p === 'bell' ? null : 'bell')} className="btn btn-secondary relative px-3 sm:px-4">
        <Bell size={18} aria-hidden="true" />
        {unread.length > 0 && <span aria-hidden="true" className="absolute -right-1 -top-1 min-w-5 rounded-full bg-brand-600 px-1.5 text-center text-[10px] font-bold leading-5 text-white">{unread.length > 99 ? '99+' : unread.length}</span>}
      </button>

      {panel === 'search' && (
        <div className={`${PANEL} sm:w-[380px]`} role="search" onKeyDown={onSearchKeys}>
          <div className="flex items-center gap-2">
            <label htmlFor="workspace-search" className="sr-only">Search projects and analyses</label>
            <input
              id="workspace-search" data-nav autoFocus autoComplete="off" className="field min-w-0 flex-1" placeholder="Search projects and analyses..." value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && results[0]) { e.preventDefault(); openResult(results[0]) } }}
            />
            <button type="button" aria-label="Close search" className="icon-btn" onClick={() => { setPanel(null); searchButton.current?.focus() }}><X size={18} aria-hidden="true" /></button>
          </div>
          <div className="mt-2 max-h-72 overflow-y-auto">
            {!query.trim() ? <p className="p-3 text-sm text-muted">Type to search saved projects and analyses.</p> : results.length ? (
              <ul aria-label="Search results">
                {results.map(r => (
                  <li key={`${r.type}-${r.id}`}>
                    <button type="button" data-nav onClick={() => openResult(r)} className="block w-full rounded-lg p-3 text-left hover:bg-tint">
                      <span className="block truncate text-sm font-semibold text-fg">{r.title}</span>
                      <span className="block truncate text-xs text-muted">{r.detail}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : <p role="status" className="p-3 text-sm text-muted">No matching saved items.</p>}
          </div>
        </div>
      )}

      {panel === 'bell' && (
        <div className={`${PANEL} sm:w-[370px]`} role="dialog" aria-label="Activity notifications">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-semibold text-fg">Activity</h2>
            <button type="button" className="btn-link text-xs disabled:opacity-50" disabled={!unread.length} onClick={() => notifications.markRead(data.analyses.map(a => a.id))}>Mark all read</button>
          </div>
          <div className="mt-2 max-h-80 overflow-y-auto">
            {!data.analyses.length ? <p className="p-3 text-sm text-muted">No activity yet. New analyses will appear here.</p> : (
              <ul>
                {data.analyses.slice(0, 20).map(a => {
                  const isUnread = !notifications.read.has(a.id)
                  return (
                    <li key={a.id}>
                      <button type="button" onClick={() => openNotification(a.id)} className="flex w-full gap-2 rounded-lg p-3 text-left hover:bg-tint">
                        <span className="mt-1.5 flex size-2 shrink-0">{isUnread && <><span aria-hidden="true" className="size-2 rounded-full bg-brand-600" /><span className="sr-only">Unread</span></>}</span>
                        <span className="min-w-0 flex-1">
                          <span className={`block text-sm text-fg ${isUnread ? 'font-semibold' : 'font-medium'}`}>{STATUS_LABEL[a.result.status]}</span>
                          <span className="block truncate text-xs text-muted">{projectNames.get(a.projectId) ?? 'Project'} · {a.request}</span>
                        </span>
                        <span className="shrink-0 text-xs text-muted">{timeAgo(a.createdAt)}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
