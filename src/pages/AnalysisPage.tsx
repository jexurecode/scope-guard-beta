import { FileText, FolderKanban, MessageSquare } from 'lucide-react'
import { AnalysisActions } from '../components/AnalysisActions'
import { AnalysisResult } from '../components/AnalysisResult'
import { CreateProjectForm } from '../components/CreateProjectForm'
import { EmptyState } from '../components/EmptyState'
import { ProjectPicker } from '../components/ProjectPicker'
import { ScopeInput } from '../components/ScopeInput'
import { analyzeScope } from '../lib/analysis-engine'
import { formatDateTime } from '../lib/format'
import { LIMITS } from '../lib/workspace'
import type { PageProps } from './page-props'

export function AnalysisPage({ scope, navigate }: PageProps) {
  if (!scope.data.projects.length || !scope.project) {
    return (
      <section className="card p-5 sm:p-6" aria-labelledby="first-project-heading">
        <h2 id="first-project-heading" className="sr-only">Create a project to begin</h2>
        <EmptyState icon={FolderKanban} title="Create a project first">Every analysis compares a client request with a project's original agreement.</EmptyState>
        <div className="mt-5"><CreateProjectForm onCreate={scope.createProject} id="first-project" /></div>
      </section>
    )
  }
  const readOnly = !!scope.active || scope.loading
  return (
    <div className="space-y-5">
      <section className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-end sm:justify-between sm:p-6" aria-label="Project">
        <div className="min-w-0 flex-1 sm:max-w-md"><ProjectPicker projects={scope.data.projects} selected={scope.projectId} onSelect={scope.selectProject} /></div>
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-xs text-muted">{scope.storageError ? 'Not saved to browser' : 'Saved in this browser'}</p>
          <button type="button" className="btn-link" onClick={() => navigate('projects')}>Manage projects</button>
        </div>
      </section>

      {scope.active && (
        <div className="rounded-xl border border-info-line bg-info-bg p-4 text-sm text-info-fg">
          Viewing saved inputs from {formatDateTime(scope.active.createdAt)}. Editing the response does not change the project agreement.
          <button type="button" onClick={scope.reset} className="ml-2 font-semibold underline">Start a new request</button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-6">
        <ScopeInput id="agreement" title="Original agreement" label="What did you agree to deliver?" placeholder="Paste the original project scope, deliverables, or agreement..." icon={FileText} value={scope.agreement} onChange={scope.updateAgreement} maxLength={LIMITS.agreement} readOnly={readOnly} />
        <ScopeInput id="request" title="New client request" label="What is your client asking for?" placeholder="Paste the client's latest request..." icon={MessageSquare} value={scope.request} onChange={scope.updateRequest} maxLength={LIMITS.request} readOnly={readOnly} />
      </div>

      {!scope.active && <AnalysisActions canAnalyze={scope.canAnalyze} loading={scope.loading} handleAnalyze={scope.handleAnalyze} loadExample={scope.loadExample} showExample={!scope.agreement.trim() && !scope.request.trim()} reset={scope.reset} />}
      {scope.sampleVisible && <section className="card space-y-3 p-5" aria-label="Sample analysis">
        <div className="flex items-center justify-between gap-3"><h3 className="font-semibold text-fg">Sample analysis (preview only)</h3><button type="button" className="btn btn-secondary" onClick={scope.closeExample}>Close preview</button></div>
        <p className="text-sm text-muted">Example agreement: Build a five-page business website with a contact form.</p>
        <p className="text-sm text-muted">Example request: Can you also add an online store with Stripe payments?</p>
        <AnalysisResult result={analyzeScope('Build a five-page business website with a contact form.', 'Can you also add an online store with Stripe payments?')} copied={false} copyReply={async () => {}} onReplyChange={() => {}} />
        <p className="text-xs text-muted">This preview does not change or save any project data.</p>
      </section>}
      <div role="status" className="text-sm text-muted">{scope.loading ? 'Checking request terms against this agreement...' : !scope.active ? 'Enter an agreement and request to generate preliminary suggestions for human review.' : ''}</div>
      {scope.error && <p role="alert" className="rounded-xl border border-line bg-danger-bg p-4 text-sm text-danger-fg">{scope.error}</p>}
      {scope.active && <AnalysisResult result={scope.active.result} copied={scope.copied} copyReply={scope.copyReply} onReplyChange={scope.updateReply} />}
    </div>
  )
}
