import { useState } from 'react'
import { FileText, FolderKanban, Pencil, ScanSearch, Trash2 } from 'lucide-react'
import { CreateProjectForm } from '../components/CreateProjectForm'
import { EmptyState } from '../components/EmptyState'
import { ScopeInput } from '../components/ScopeInput'
import { LIMITS } from '../lib/workspace'
import type { PageProps } from './page-props'

export function ProjectsPage({ scope, navigate }: PageProps) {
  const { projects, analyses } = scope.data
  const current = scope.project
  const [renaming, setRenaming] = useState(false)
  const [editedName, setEditedName] = useState('')
  const countFor = (id: string) => analyses.filter(a => a.projectId === id).length

  return (
    <div className="space-y-5 lg:space-y-6">
      <section className="card p-5 sm:p-6" aria-labelledby="create-heading">
        <h2 id="create-heading" className="mb-4 text-lg font-semibold text-fg">Create a project</h2>
        <CreateProjectForm onCreate={name => { setRenaming(false); scope.createProject(name) }} />
      </section>

      {!projects.length ? (
        <EmptyState icon={FolderKanban} title="No projects yet">Create your first project to save an agreement and start reviewing client requests.</EmptyState>
      ) : (
        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-6">
          <section aria-labelledby="projects-heading" className="card min-w-0 p-4 sm:p-5">
            <h2 id="projects-heading" className="mb-3 px-1 text-lg font-semibold text-fg">Your projects <span className="text-sm font-normal text-muted">({projects.length})</span></h2>
            <ul className="space-y-2">
              {projects.map(p => (
                <li key={p.id}>
                  <button
                    type="button"
                    aria-pressed={p.id === scope.projectId}
                    onClick={() => { setRenaming(false); scope.selectProject(p.id) }}
                    className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors ${p.id === scope.projectId ? 'border-brand-500 bg-tint' : 'border-line hover:bg-tint'}`}
                  >
                    <span className="icon-tile"><FolderKanban size={19} aria-hidden="true" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-fg">{p.name}</span>
                      <span className="mt-0.5 block line-clamp-2 break-words text-xs text-muted">{p.agreement.trim() || 'No agreement saved yet'}</span>
                      <span className="mt-1.5 block text-xs font-medium text-tint-fg">{countFor(p.id)} {countFor(p.id) === 1 ? 'analysis' : 'analyses'}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>

          {current && (
            <section aria-labelledby="detail-heading" className="min-w-0 space-y-4">
              <div className="card p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 id="detail-heading" className="min-w-0 break-words text-lg font-semibold text-fg">{current.name}</h2>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className="btn btn-secondary" onClick={() => { setEditedName(current.name); setRenaming(true) }}><Pencil size={15} aria-hidden="true" /> Rename</button>
                    <button type="button" className="btn btn-danger" onClick={() => {
                      if (window.confirm(`Delete "${current.name}" and all its saved analyses? This cannot be undone.`)) { setRenaming(false); scope.deleteProject() }
                    }}><Trash2 size={15} aria-hidden="true" /> Delete project</button>
                  </div>
                </div>
                {renaming && (
                  <form className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={e => { e.preventDefault(); if (editedName.trim()) { scope.renameProject(editedName); setRenaming(false) } }}>
                    <div className="min-w-0 flex-1">
                      <label htmlFor="rename" className="field-label">Project name</label>
                      <input id="rename" className="field" value={editedName} onChange={e => setEditedName(e.target.value)} required maxLength={LIMITS.name} autoFocus />
                    </div>
                    <div className="flex gap-2">
                      <button type="submit" className="btn btn-primary" disabled={!editedName.trim()}>Save name</button>
                      <button type="button" className="btn btn-secondary" onClick={() => setRenaming(false)}>Cancel</button>
                    </div>
                  </form>
                )}
              </div>
              <ScopeInput id="project-agreement" title="Original agreement" label="What did you agree to deliver?" placeholder="Paste the original project scope, deliverables, or agreement..." icon={FileText} value={current.agreement} onChange={scope.updateAgreement} maxLength={LIMITS.agreement} readOnly={scope.loading} />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-muted">{scope.storageError ? 'Not saved to browser' : 'Changes are saved in this browser as you type.'}</p>
                <button type="button" onClick={() => navigate('analysis')} className="btn btn-primary"><ScanSearch size={16} aria-hidden="true" /> Analyze a request</button>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
