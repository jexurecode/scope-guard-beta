import { useState } from 'react'
import { FileText, Pencil, ScanSearch, Trash2 } from 'lucide-react'
import { ScopeInput } from '../components/ScopeInput'
import { AnalysisHistory } from '../components/AnalysisHistory'
import { LIMITS } from '../lib/workspace'
import type { PageProps } from './page-props'
export function ProjectWorkspacePage({ scope, navigate, openAnalysis }: PageProps) {
  const current = scope.project
  const [renaming, setRenaming] = useState(false)
  const [editedName, setEditedName] = useState('')
  const [nameError, setNameError] = useState('')
  const [full, setFull] = useState(false)
  return <div className="space-y-5">
    <button className="btn btn-secondary" onClick={() => navigate('projects')}>All projects</button>
          {current && (
            <section aria-labelledby="detail-heading" className="min-w-0 space-y-4">
              <div className="card p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 id="detail-heading" className="min-w-0 break-words text-lg font-semibold text-fg">{current.name}</h2>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className="btn btn-secondary" onClick={() => { setEditedName(current.name); setNameError(''); setRenaming(true) }}><Pencil size={15} aria-hidden="true" /> Rename</button>
                    <button type="button" className="btn btn-danger" onClick={() => {
                      if (window.confirm(`Delete "${current.name}" and all its saved analyses? This cannot be undone.`)) { setRenaming(false); scope.deleteProject(); navigate('projects') }
                    }}><Trash2 size={15} aria-hidden="true" /> Delete project</button>
                  </div>
                </div>
                {renaming && (
                  <form className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={e => { e.preventDefault(); if (editedName.trim()) { if (scope.renameProject(editedName)) { setRenaming(false); setNameError('') } else { setNameError('That name already exists. Use a distinct engagement name, or open the existing project from All projects.') } } }}>
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
                {nameError && <p role="alert" className="mt-3 text-sm text-danger-fg">{nameError}</p>}
              </div>
              <div className="card p-4"><button type="button" className="btn btn-secondary" onClick={() => setFull(!full)}>{full ? 'Close full agreement' : 'View Full Agreement'}</button>{full && <div tabIndex={0} className="mt-4 max-h-[60vh] overflow-y-auto whitespace-pre-wrap break-words text-sm" aria-label="Full agreement">{current.agreement || 'No agreement saved yet'}</div>}</div>
              <ScopeInput id="project-agreement" title="Original agreement" label="What did you agree to deliver?" placeholder="Paste the original project scope, deliverables, or agreement..." icon={FileText} value={current.agreement} onChange={scope.updateAgreement} onImport={scope.importAgreementFile} maxLength={LIMITS.agreement} readOnly={scope.loading} />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-muted">{scope.storageError ? 'Not saved to browser' : 'Changes are saved in this browser as you type.'}</p>
                <button type="button" onClick={() => { scope.reset(); navigate('analysis') }} className="btn btn-primary"><ScanSearch size={16} aria-hidden="true" /> Analyze a request</button>
              </div>
            </section>
          )}
    <section className="card p-5"><h2 className="mb-3 text-lg font-semibold">Client requests and analysis history</h2><AnalysisHistory items={scope.history} onOpen={openAnalysis} /></section>
  </div>
}
