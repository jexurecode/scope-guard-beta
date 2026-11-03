import { Activity, AlertTriangle, ArrowRight, ChevronRight, FolderKanban, History, Inbox, Plus, ScanSearch, ShieldCheck, Zap } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { AnalysisRow } from '../components/AnalysisRow'
import { EmptyState } from '../components/EmptyState'
import { Sparkline } from '../components/Sparkline'
import { isWithinDays } from '../lib/format'
import { dailyCounts } from '../lib/sparkline'
import type { PageProps } from './page-props'

type Tone = 'purple' | 'violet' | 'amber' | 'emerald'
type Accent = 'purple' | 'amber' | 'emerald'

export function DashboardPage({ scope, navigate, openAnalysis }: PageProps) {
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
    { label: 'Scope changes', value: changes.length, delta: weekly(changes), note: 'this week', icon: AlertTriangle, tone: 'amber', trend: daily(changes) },
    { label: 'Manual review', value: reviews.length, delta: weekly(reviews), note: 'this week', icon: ShieldCheck, tone: 'emerald', trend: daily(reviews) },
  ]

  const quickActions: { title: string; description: string; icon: LucideIcon; to: 'analysis' | 'projects' | 'history'; accent: Accent; primary?: boolean }[] = [
    { title: 'New analysis', description: 'Compare a client request with your agreement', icon: Plus, to: 'analysis', accent: 'purple', primary: true },
    { title: 'Manage projects', description: 'Create, rename, or update agreements', icon: FolderKanban, to: 'projects', accent: 'amber' },
    { title: 'Browse history', description: 'Reopen and edit earlier analyses', icon: History, to: 'history', accent: 'emerald' },
  ]

  return (
    <div className="space-y-5 lg:space-y-6">
      <section className="relative overflow-hidden rounded-2xl border border-line welcome-gradient p-5 shadow-card sm:p-7">
        <div className="relative z-10 max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-tint-fg">Your workspace</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-fg sm:text-3xl">Welcome back</h2>
          <p className="mt-2 text-sm leading-6 text-muted sm:text-base">Compare new client requests with what you agreed to deliver, spot potential scope changes early, and prepare a professional reply. Everything stays in this browser.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button type="button" onClick={() => navigate('analysis')} className="btn btn-primary px-5"><Plus size={17} aria-hidden="true" /> Analyze a request</button>
            <button type="button" onClick={() => navigate('projects')} className="btn btn-secondary px-5"><FolderKanban size={17} aria-hidden="true" /> View projects</button>
          </div>
        </div>
        <div aria-hidden="true" className="shield-art absolute -right-10 top-1/2 hidden -translate-y-1/2 lg:block">
          <div className="shield-ring flex size-64 items-center justify-center rounded-full border-[28px] border-brand-200/40 dark:border-brand-300/10">
            <span className="shield-badge flex size-28 items-center justify-center rounded-3xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-lg shadow-brand-800/20"><ShieldCheck size={56} strokeWidth={1.75} /></span>
          </div>
        </div>
      </section>

      <section aria-label="Overview" className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {stats.map(({ label, value, delta, note, icon: Icon, tone, trend }) => (
          <div key={label} className={`card tone-${tone} flex min-w-0 flex-col p-4 sm:p-5`}>
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4">
              <span className="metric-tile flex size-12 shrink-0 items-center justify-center rounded-xl"><Icon size={23} aria-hidden="true" /></span>
              <div className="min-w-0">
                <p className="text-2xl font-bold leading-none tabular-nums text-fg">{value}</p>
                <p className="mt-1 text-sm font-medium text-fg">{label}</p>
                {delta === null
                  ? <p className="text-xs text-muted">{note}</p>
                  : <p className={`text-xs ${delta === 0 ? 'text-muted' : tone === 'amber' ? 'metric-delta-amber' : 'metric-delta-up'}`}>{delta > 0 && <span aria-hidden="true">↑ </span>}{delta > 0 ? `+${delta}` : delta} {note}</p>}
              </div>
            </div>
            <div className="mt-auto pt-4"><Sparkline values={trend} label={label} /></div>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:gap-6">
        <section aria-labelledby="recent-heading" className="card min-w-0 p-4 sm:p-5">
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
            <EmptyState icon={FolderKanban} title="No projects yet" action={<button type="button" onClick={() => navigate('projects')} className="btn btn-primary"><Plus size={16} aria-hidden="true" /> Create a project</button>}>Create a project and save its agreement to start checking client requests.</EmptyState>
          )}
        </section>

        <section aria-labelledby="quick-heading" className="card min-w-0 p-4 sm:p-5">
          <h3 id="quick-heading" className="mb-3 flex items-center gap-2 px-1 text-lg font-semibold text-fg"><Zap size={19} className="text-tint-fg" aria-hidden="true" /> Quick actions</h3>
          <ul className="space-y-2">
            {quickActions.map(({ title, description, icon: Icon, to, accent, primary }) => (
              <li key={title}>
                <button type="button" onClick={() => navigate(to)} className={`qa-card qa-${accent}${primary ? ' qa-primary' : ''}`}>
                  <span className="qa-icon"><Icon size={19} aria-hidden="true" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-fg">{title}</span>
                    <span className="block text-xs text-muted">{description}</span>
                  </span>
                  <ChevronRight size={17} aria-hidden="true" className="qa-chevron shrink-0 text-muted" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
