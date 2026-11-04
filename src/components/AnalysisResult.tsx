import { AlertTriangle, Check, Copy, Info, CircleCheck, CircleHelp } from 'lucide-react'
import { LIMITS } from '../lib/workspace'
import type { Analysis } from '../types/analysis'
import { StatusBadge } from './StatusBadge'

type Props = { result: Analysis; copied: boolean; copyReply: () => Promise<void>; onReplyChange: (reply: string) => void }

export function AnalysisResult({ result, copied, copyReply, onReplyChange }: Props) {
  const potential = result.status === 'potential-change'
  const Icon = potential ? AlertTriangle : Info
  const tone = potential ? 'border-warn-line bg-warn-bg text-warn-fg' : 'border-info-line bg-info-bg text-info-fg'
  return (
    <section aria-live="polite" className="card mt-6 overflow-hidden">
      <div className={`flex items-start gap-4 border-b p-5 sm:p-6 ${tone}`}>
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-surface"><Icon size={22} aria-hidden="true" /></span>
        <div className="min-w-0 break-words">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider">Preliminary analysis</p>
            <StatusBadge status={result.status} />
          </div>
          <h3 className="mt-2 text-xl font-bold text-fg">{result.title}</h3>
          <p className="mt-2 text-sm leading-6 text-fg">{result.explanation}</p>
        </div>
      </div>

      <div className="space-y-6 p-5 sm:p-6">
        {result.detectedChanges.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-fg">Potential changes identified</h4>
            <ul className="mt-3 space-y-3">
              {result.detectedChanges.map((change) => (
                <li key={change.feature} className="rounded-xl border border-warn-line bg-warn-bg p-4 break-words">
                  <p className="font-semibold text-warn-fg">{change.feature}</p>
                  <p className="mt-1.5 text-sm text-fg">{change.explanation}</p>
                  <p className="mt-2 text-xs text-muted">Matched request term: "{change.requestEvidence}"</p>
                  {change.agreementEvidence && <p className="mt-2 text-xs text-fg"><strong>Agreement evidence:</strong> “{change.agreementEvidence}”</p>}
                </li>
              ))}
            </ul>
          </div>
        )}

        {!!result.tasks?.length && (
          <div>
            <h4 className="text-sm font-semibold text-fg">Task-by-task assessment ({result.tasks.length})</h4>
            <p className="mt-1 text-xs text-muted">Preliminary rules-based classification. A likely covered item is not approval, and unmatched tasks need human review.</p>
            <ol className="mt-3 space-y-3">
              {result.tasks.map((task, index) => {
                const possiblyNew = task.verdict === 'potential-change'
                const likelyCovered = task.verdict === 'likely-covered'
                const TaskIcon = possiblyNew ? AlertTriangle : likelyCovered ? CircleCheck : CircleHelp
                return <li key={`${index}-${task.requestEvidence.slice(0, 24)}`} className="rounded-xl border border-line bg-surface p-4 break-words">
                  <div className="flex flex-wrap items-center gap-2">
                    <TaskIcon size={17} aria-hidden="true" />
                    <span className="text-sm font-semibold text-fg">Task {index + 1}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${possiblyNew ? 'bg-warn-bg text-warn-fg' : likelyCovered ? 'bg-info-bg text-info-fg' : 'bg-surface-secondary text-muted'}`}>
                      {possiblyNew ? 'Potential change' : likelyCovered ? 'Likely covered' : 'Needs review'}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-fg">{task.task}</p>
                  <p className="mt-2 text-xs leading-5 text-muted">{task.explanation}</p>
                  {task.agreementEvidence && <p className="mt-2 rounded-md border border-line p-2 text-xs text-fg"><strong>Agreement evidence:</strong> “{task.agreementEvidence}”</p>}
                  {!task.agreementEvidence && <p className="mt-2 text-xs italic text-muted">No reliable matching agreement clause was found.</p>}
                </li>
              })}
            </ol>
          </div>
        )}

        {!!result.reviewNotes?.length && (
          <div className="rounded-xl border border-info-line bg-info-bg p-4">
            <h4 className="font-semibold text-info-fg">Items for human review</h4>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-fg">
              {result.reviewNotes.map(note => <li key={note}>{note}</li>)}
            </ul>
          </div>
        )}

        <div>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <label htmlFor="reply" className="font-semibold text-fg">Suggested client response</label>
            <button type="button" onClick={copyReply} disabled={!result.reply.trim()} className="btn btn-secondary min-h-9 px-3 py-1.5 text-xs">
              {copied ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <textarea id="reply" value={result.reply} onChange={e => onReplyChange(e.target.value)} maxLength={LIMITS.reply} aria-describedby="reply-help" className="field min-h-44 resize-y leading-7" />
          <p id="reply-help" className="mt-2 text-xs text-muted">Edit before sending. Changes are saved with this analysis. {result.reply.length.toLocaleString()} / {LIMITS.reply.toLocaleString()} characters.</p>
        </div>

        <p className="text-xs leading-5 text-muted">
          Prototype limitation: this checker uses keyword and context rules (including in mock mode), not a real AI model or legal analysis. It may miss scope changes or flag requests incorrectly. Always review your agreement yourself.
        </p>
      </div>
    </section>
  )
}
