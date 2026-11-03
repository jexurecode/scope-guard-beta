import { useState } from 'react'
import { AnalysisHistory } from '../components/AnalysisHistory'
import { EmptyState } from '../components/EmptyState'
import { ProjectPicker } from '../components/ProjectPicker'
import { FolderKanban } from 'lucide-react'
import type { PageProps } from './page-props'

export function HistoryPage({ scope, navigate, openAnalysis }: PageProps) {
  const { projects, analyses } = scope.data
  const [filter, setFilter] = useState('all')
  const effective = projects.some(p => p.id === filter) ? filter : 'all'
  const items = effective === 'all' ? analyses : analyses.filter(a => a.projectId === effective)
  const projectNames = Object.fromEntries(projects.map(p => [p.id, p.name]))

  if (!projects.length) {
    return <section className="card p-5 sm:p-6"><EmptyState icon={FolderKanban} title="No projects yet" action={<button type="button" onClick={() => navigate('projects')} className="btn btn-primary">Create a project</button>}>Analyses are saved per project. Create a project to get started.</EmptyState></section>
  }
  return (
    <div className="space-y-5">
      <section className="card flex flex-col gap-3 p-5 sm:flex-row sm:items-end sm:justify-between sm:p-6" aria-label="Filter">
        <div className="min-w-0 flex-1 sm:max-w-md"><ProjectPicker id="history-project" label="Show analyses for" projects={projects} selected={effective} onSelect={setFilter} allowAll /></div>
        <p className="text-sm text-muted">{items.length} {items.length === 1 ? 'analysis' : 'analyses'}</p>
      </section>
      <div className="card p-3 sm:p-4">
        <AnalysisHistory items={items} activeId={scope.active?.id} onOpen={openAnalysis} projectNames={projectNames} />
      </div>
    </div>
  )
}
