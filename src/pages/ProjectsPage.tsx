import { useState } from 'react'
import { FolderKanban } from 'lucide-react'
import { EmptyState } from '../components/EmptyState'
import { agreementPreview } from '../lib/project-experience'
import type { PageProps } from './page-props'
export function ProjectsPage({ scope, navigate }: PageProps) {
  const [fullId, setFullId] = useState<string | null>(null)
  const full = scope.data.projects.find(p => p.id === fullId)
  return <div className="space-y-5">
    <button className="btn btn-primary" onClick={() => navigate('new-project')}>New project</button>
    {!scope.data.projects.length && <EmptyState icon={FolderKanban} title="No projects yet">Create your first project to save an agreement.</EmptyState>}
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">{scope.data.projects.map(p => <li key={p.id} className="card min-w-0 space-y-3 p-5">
      <h2 className="truncate font-semibold">{p.name}</h2>
      <p className="line-clamp-3 break-words text-sm text-muted">{agreementPreview(p.agreement) || 'No agreement saved yet'}</p>
      <p className="text-xs text-muted">{scope.data.analyses.filter(a => a.projectId === p.id).length} analyses</p>
      <div className="flex flex-wrap gap-2"><button className="btn btn-primary" onClick={() => { scope.selectProject(p.id); navigate('project') }}>Open project</button><button className="btn btn-secondary" onClick={() => setFullId(p.id)}>View Full Agreement</button></div>
    </li>)}</ul>
    {full && <section className="card p-5" aria-label="Full agreement"><div className="flex justify-between gap-3"><h2 className="break-words font-semibold">{full.name} — Full agreement</h2><button className="btn btn-secondary" onClick={() => setFullId(null)}>Close</button></div><div tabIndex={0} className="mt-4 max-h-[60vh] overflow-y-auto whitespace-pre-wrap break-words text-sm">{full.agreement || 'No agreement saved yet'}</div></section>}
  </div>
}
