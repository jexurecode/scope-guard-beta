import { useState } from 'react'
import { analyzeScope } from '../lib/analysis-engine'
import { Activity, AlertTriangle, ArrowRight, ChevronRight, FolderKanban, History, Inbox, Plus, ScanSearch, CircleHelp, Sparkles, Zap } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { AnalysisRow } from '../components/AnalysisRow'
import { EmptyState } from '../components/EmptyState'
import { WorkspaceIllustration } from '../components/WorkspaceIllustration'
import { Sparkline } from '../components/Sparkline'
import { isWithinDays } from '../lib/format'
import { dailyCounts } from '../lib/sparkline'
import type { PageProps } from './page-props'

type Tone = 'purple' | 'violet' | 'amber' | 'blue'
type Accent = 'purple' | 'amber' | 'emerald'

export function DashboardPage({ scope, navigate, openAnalysis }: PageProps) {
  const [showExample, setShowExample] = useState(false)
  const example = showExample ? analyzeScope('Project includes homepage copy edits and gallery image replacement. Customer booking systems are excluded.', '1. Update homepage copy.\n2. Replace gallery images.\n3. Add a customer booking system.') : null
  const { projects, analyses } = scope.data
  const changes = analyses.filter(a => a.result.status === 'potential-change')
  const reviews = analyses.filter(a => a.result.status === 'needs-review')
  const projectNames = Object.fromEntries(projects.map(p => [p.id, p.name]))

  const weekly = (list: typeof analyses) => list.filter(a => isWithinDays(a.createdAt, 7)).length
  const daily = (list: typeof analyses) => dailyCounts(list.map(a => a.createdAt))

  // Projects have no creation date in saved data, so there is no history to chart (trend: null).
  const stats: { label: string; value: number; delta: number | null; note: string; icon: LucideIcon; tone: Tone; trend: number[] | null }[] = [
    { label: 'Projects', value: projects.length, delta: null, note: 'Saved locally', icon: FolderKanban, tone: 'purple', trend: null },
    { label: 'Analyses', value: analyses.length, delta: weekly(analyses), note: 'this week', icon: Activity, tone: 'violet', trend: daily(analyses) },
    { label: 'Potential changes', value: changes.length, delta: weekly(changes), note: 'this week', icon: AlertTriangle, tone: 'amber', trend: daily(changes) },
    { label: 'Need review', value: reviews.length, delta: weekly(reviews), note: 'this week', icon: CircleHelp, tone: 'blue', trend: daily(reviews) },
  ]

  const quickActions: { title: string; description: string; icon: LucideIcon; to?: 'analysis' | 'new-project' | 'history'; accent: Accent }[] = [
    { title: 'New analysis', description: 'Review a client request', icon: Plus, to: 'analysis', accent: 'purple' },
    { title: 'New project', description: 'Start a new engagement', icon: FolderKanban, to: 'new-project', accent: 'amber' },
    { title: 'Browse history', description: 'Revisit saved responses', icon: History, to: 'history', accent: 'emerald' },
    { title: 'Try sample', description: 'Explore a mixed request', icon: Sparkles, accent: 'purple' },
  ]
  function toggleExample() {
    setShowExample(value => !value)
    // The sample lives below the dashboard, outside the normal project workflow.
    requestAnimationFrame(() => document.getElementById('dashboard-example')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'nearest' }))
  }

  return (
    <div className="dashboard-content space-y-4 lg:space-y-5">
      <section className="dashboard-welcome welcome-gradient">
        <div className="welcome-copy">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-tint-fg sm:text-xs">Your workspace</p>
          <h2 className="mt-1.5 text-2xl font-bold tracking-tight text-fg sm:text-3xl">Welcome back</h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-muted">Review client requests before agreeing to extra work.</p>
          <div className="welcome-actions mt-4 flex flex-wrap gap-2.5">
            <button type="button" onClick={() => navigate('analysis')} className="btn btn-primary"><Plus size={17} aria-hidden="true" /> Analyze a request</button>
            <button type="button" onClick={() => navigate('projects')} className="btn btn-secondary"><FolderKanban size={17} aria-hidden="true" /> View projects</button>
          </div>
        </div>
        <div className="welcome-art"><WorkspaceIllustration /></div>
      </section>

      <section aria-label="Overview">
        <h3 className="mb-2.5 text-base font-semibold text-fg">Key metrics</h3>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {stats.map(({ label, value, delta, note, icon: Icon, tone, trend }) => (
            <div key={label} className={`card metric-card tone-${tone}`}>
              <div className="flex items-start gap-2.5">
                <span className="metric-tile flex size-9 shrink-0 items-center justify-center rounded-xl sm:size-10"><Icon size={21} aria-hidden="true" /></span>
                <div className="min-w-0">
                  <p className="text-2xl font-bold leading-none tabular-nums text-fg">{value}</p>
                  <p className="mt-1 text-xs font-medium leading-4 text-fg sm:text-sm">{label}</p>
                </div>
              </div>
              <p className="mt-2 text-[11px] text-muted">{delta === null ? note : <>{delta > 0 && <span aria-hidden="true">↑ </span>}{delta} {note}</>}</p>
              {trend ? <div className="metric-trend"><Sparkline values={trend} label={label} /></div> : <span className="sr-only">{label}: no history is tracked for this metric</span>}
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)] xl:gap-5">
        <section aria-labelledby="recent-heading" className="card recent-activity min-w-0 p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-3 px-1">
            <h3 id="recent-heading" className="flex items-center gap-2 text-lg font-semibold text-fg"><History size={19} className="text-tint-fg" aria-hidden="true" /> Recent activity</h3>
            {analyses.length > 0 && <button type="button" onClick={() => navigate('history')} className="btn-link">View all <ArrowRight size={14} aria-hidden="true" /></button>}
          </div>
          {analyses.length ? (
            <ul className="divide-y divide-line">
              {analyses.slice(0, 4).map(item => <li key={item.id} className="py-1"><AnalysisRow item={item} projectName={projectNames[item.projectId]} onOpen={openAnalysis} /></li>)}
            </ul>
          ) : projects.length ? (
            <EmptyState icon={Inbox} title="No analyses yet" action={<button type="button" onClick={() => navigate('analysis')} className="btn btn-primary"><ScanSearch size={16} aria-hidden="true" /> Start your first analysis</button>}>Paste a client request and check it against a project agreement.</EmptyState>
          ) : (
            <EmptyState icon={FolderKanban} title="No projects yet" action={<button type="button" onClick={() => navigate('new-project')} className="btn btn-primary"><Plus size={16} aria-hidden="true" /> Create a project</button>}>Create a project and save its agreement to start checking client requests.</EmptyState>
          )}
        </section>

        <section aria-labelledby="quick-heading" className="card min-w-0 p-4 sm:p-5">
          <h3 id="quick-heading" className="mb-3 flex items-center gap-2 px-1 text-lg font-semibold text-fg"><Zap size={19} className="text-tint-fg" aria-hidden="true" /> Quick actions</h3>
          <ul className="grid grid-cols-2 gap-3">
            {quickActions.map(({ title, description, icon: Icon, to, accent }) => (
              <li key={title}>
                <button type="button" aria-expanded={to ? undefined : showExample} aria-controls={to ? undefined : 'sample-tasks'} onClick={() => to ? navigate(to) : toggleExample()} className={`qa-card qa-grid-card qa-${accent}`}>
                  <span className="qa-icon"><Icon size={19} aria-hidden="true" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-fg">{title}</span>
                    <span className="mt-1 block text-xs leading-4 text-muted">{description}</span>
                  </span>
                  <ChevronRight size={17} aria-hidden="true" className="qa-chevron shrink-0 text-muted" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section id="dashboard-example" className="sample-strip scroll-mb-28" aria-label="Quick demonstration">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3"><Sparkles className="shrink-0 text-tint-fg" size={22} aria-hidden="true" /><div>
            <h3 className="text-sm font-semibold text-fg sm:text-base">See a mixed-scope example</h3>
            <p className="mt-0.5 text-xs text-muted">Three tasks. One agreement. No project needed.</p>
          </div></div>
          <button type="button" className="btn btn-secondary sample-toggle" aria-expanded={showExample} aria-controls="sample-tasks" onClick={toggleExample}>{showExample ? 'Hide example' : 'Try sample analysis'}</button>
        </div>
        <div id="sample-tasks" hidden={!example} className="mt-4 space-y-3 border-t border-line pt-4">
          <p className="text-xs text-muted">Sample agreement: homepage copy edits and gallery image replacements included; booking systems excluded.</p>
          <div className="grid gap-2 sm:grid-cols-3">{example?.tasks?.map((task, i) => <div key={i} className="rounded-lg border border-line bg-surface p-3">
            <p className="text-xs font-semibold text-fg">Task {i + 1}: {task.verdict === 'potential-change' ? 'Potential change' : task.verdict === 'likely-covered' ? 'Likely covered' : 'Needs review'}</p>
            <p className="mt-1 text-xs text-muted">{task.task}</p>
          </div>)}</div>
          <p className="text-xs text-muted">This is a rules-based example, not an AI or legal verdict. Real contracts can be more complex.</p>
          <button type="button" className="btn btn-primary" onClick={() => navigate('analysis')}>Analyze my own contract <ArrowRight size={15} aria-hidden="true" /></button>
        </div>
      </section>

    </div>
  )
}
