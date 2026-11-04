import { findFeatureMentions } from './feature-context'

export const MAX_TASKS = 24
export type TaskVerdict = 'potential-change' | 'likely-covered' | 'needs-review'
export type TaskAssessment = {
  task: string
  verdict: TaskVerdict
  explanation: string
  requestEvidence: string
  agreementEvidence?: string
}

const action = '(?:add|build|create|develop|implement|integrate|install|enable|update|edit|change|replace|fix|revise|adjust|redesign|remove|include|make|provide)'
const taskBoundary = new RegExp(`(?:\\s*;\\s*|\\n+|(?<=[.!?])\\s+(?=(?:please\\s+|also\\s+|can you\\s+|we (?:need|want) to\\s+)*${action}\\b)|,\\s*(?:and\\s+)?(?=(?:please\\s+|also\\s+)*${action}\\b)|\\s+and\\s+(?=(?:please\\s+|also\\s+)*${action}\\b))`, 'i')

/**
 * Split explicit task lists without stripping the wording that changes intent.
 * In particular, a quoted example or a conditional clause ("If we expand,")
 * must not turn into an unconditional "add payments" task after splitting.
 */
export function splitClientTasks(request: string): string[] {
  const lines = request.replace(/\r/g, '\n').replace(/(^|\n)\s*(?:[-*•]|\d{1,2}[.)])\s+/g, '$1')
  const quotedSpans = Array.from(lines.matchAll(/"[^"\n]*"|“[^”\n]*”|(?:^|\s)'[^'\n]*'/g), match => ({
    start: match.index,
    end: match.index + match[0].length,
  }))
  const boundaries = new RegExp(taskBoundary.source, 'gi')
  const parts: string[] = []
  let start = 0
  for (const boundary of lines.matchAll(boundaries)) {
    const position = boundary.index
    const insideQuote = quotedSpans.some(span => position >= span.start && position < span.end)
    if (insideQuote) continue

    // Conditional lead-ins apply to all actions in the same sentence, including
    // comma-separated and "and add" clauses. Only split after a sentence break.
    const preceding = lines.slice(0, position)
    const sentenceStart = Math.max(
      preceding.lastIndexOf('.'), preceding.lastIndexOf('!'), preceding.lastIndexOf('?'),
      preceding.lastIndexOf(';'), preceding.lastIndexOf('\n'),
    ) + 1
    const sentencePrefix = lines.slice(sentenceStart, position).trim()
    if (/^(?:,|\s+and\s+)/i.test(boundary[0]) && /^(?:if|when|unless|assuming|provided|maybe|perhaps|possibly|potentially|consider|discuss|explore|should we|do we need|could we)\b/i.test(sentencePrefix)) continue

    parts.push(lines.slice(start, position))
    start = position + boundary[0].length
  }
  parts.push(lines.slice(start))
  return parts.map(part => part.trim().replace(/^(?:and|also)\s+/i, '').trim()).filter(Boolean)
}

const filler = new Set('a an the and or but to for from in on of with by about we i you they them their our my your me client please could can would should must need needs want wants requested request add added adding build building create creating implement implementing integrate integration update updating updates updated edit edits editing change changes changing replace replacing fix fixed fixing revise revision revisions make also new some simple just this that it is are be will was were as at up do does did website site web work task feature system functionality functionalitys'.split(' '))
function words(value: string): Set<string> {
  return new Set((value.toLowerCase().match(/[a-z0-9]+/g) || []).map(v => v.endsWith('ies') ? v.slice(0, -3) + 'y' : v.endsWith('s') && v.length > 4 ? v.slice(0, -1) : v).filter(w => w.length >= 3 && !filler.has(w)))
}
function overlap(a: Set<string>, b: Set<string>): number {
  let n = 0
  a.forEach(w => { if (b.has(w)) n++ })
  return n
}
const explicitExclusion = /\b(?:exclude(?:d|s)?|excluding|exclusions|out of scope|not included|not covered|not part of|(?:isn['’]t|aren['’]t|wasn['’]t) (?:included|covered|provided)|will not|shall not|without|no (?:additional |extra )?(?:support for |implementation of )?|not provided)\b/i
const revisionScope = /\b(?:update|updating|updates|revision|revisions|revise|editing|edit|edits|replace|replacing|replacement|changes|change|maintenance|maintain|adjustments|modify|modifications)\b/i
const revisionRequest = /\b(?:update|edit|change|replace|revise|adjust|fix|correct|modify)\b/i
const deliverableScope = /\b(?:include|includes|included|implement|build|develop|provide|deliver|create)\b/i
const additionRequest = /\b(?:add|build|create|develop|implement|integrate|enable|include|install|want|need|require|provide)\b/i

function exclusionSubjects(clause: string): Set<string>[] {
  const subject = clause.replace(/\b(?:is|are|was|were|will|shall|be|not|no|included|includes|include|excluded|excludes|exclude|excluding|covered|provided|out of scope|support for|implementation of|optional|may|might|could|not part of|isn['’]t|aren['’]t|wasn['’]t|exclusions)\b/gi, ' ')
  return subject.split(/,|\band\b|\bor\b/i).map(words).filter(tokens => tokens.size > 0)
}

function agreementClauses(text: string): string[] {
  // Keep modest context around phrases, without sending or showing entire confidential contracts.
  return text.split(/[\n.!?;]+/).flatMap(sentence => /["“”]/.test(sentence) ? [sentence] : sentence.split(/\b(?:but|however)\b|(?<=\b(?:included|excluded|covered|optional))\s*(?:,|\band\b)\s*/i)).map(x => x.trim()).filter(x => x.length >= 7)
}

/** Conservative evidence: only mark coverage when agreement actually names the capability or revision. */
export function assessClientTasks(agreement: string, request: string): { tasks: TaskAssessment[]; omitted: number } {
  const raw = splitClientTasks(request)
  const omitted = Math.max(0, raw.length - MAX_TASKS)
  const originalMentions = findFeatureMentions(agreement, true)
  const clauses = agreementClauses(agreement).map(clause => ({ clause, tokens: words(clause) }))
  const tasks = raw.slice(0, MAX_TASKS).map<TaskAssessment>(task => {
    const requestEvidence = task.slice(0, 1000)
    const normalizedTask = task.toLowerCase()
    const mentioned = findFeatureMentions(task)
    const requested = mentioned.filter(m => m.intent === 'addition')
    const excludedInRequest = mentioned.filter(m => m.intent === 'excluded')
    const uncertainInRequest = mentioned.some(m => m.intent === 'uncertain')
    const negativeRequest = /\b(?:do not|don't|not|without|remove|drop|exclude|no need)\b/i.test(task)
    if (negativeRequest && !requested.length) {
      return { task, verdict: 'needs-review', requestEvidence, explanation: 'This appears to remove or exclude work rather than add it. Check whether the change affects the agreed deliverables.' }
    }
    if (uncertainInRequest && !requested.length) {
      return { task, verdict: 'needs-review', requestEvidence, explanation: 'The requested capability is phrased as a possibility or modification. Clarify what must be delivered.' }
    }
    // The feature parser deliberately classifies quoted, hypothetical, minor-edit,
    // and non-addition wording as uncertain. Do not override that decision with
    // the broad agreement-word-overlap fallback below.
    if (mentioned.length > 0 && requested.length === 0) {
      return { task, verdict: 'needs-review', requestEvidence, explanation: 'No explicit new capability was requested. Clarify whether this changes the agreed deliverables.' }
    }
    // Unknown capabilities still retain conditional, quoted and negative context.
    if (/\b(?:if|when|unless|assuming|provided|maybe|perhaps|possibly|potentially|might|consider|discuss|explore|could we|should we|optional|future|later|whether)\b|["“”]|(?:^|\s)'[^']+'/i.test(task)) {
      return { task, verdict: 'needs-review', requestEvidence, explanation: 'Conditional or quoted wording requires clarification before treating this as a deliverable.' }
    }
    // Text-only fallback for explicit exclusions/revision clauses outside the limited feature catalog.
    const taskWords = words(normalizedTask)
    const candidates = clauses.map(c => ({ ...c, common: overlap(taskWords, c.tokens) }))
      .filter(c => c.common >= 2 || (c.common === 1 && explicitExclusion.test(c.clause) && exclusionSubjects(c.clause).some(subject => subject.size === 1 && [...subject].every(w => taskWords.has(w)))))
      .sort((a, b) => b.common - a.common || a.clause.length - b.clause.length)
    const relevant = clauses.filter(c => {
      return exclusionSubjects(c.clause).some(subject => [...subject].every(w => taskWords.has(w)))
    })
    const qualifiedAgreement = /\b(?:optional|may|might|could|if|unless|future|not excluded|not only|not just)\b|["“”]|(?:^|\s)'[^']+'/i
    const excludedClause = relevant.find(c => explicitExclusion.test(c.clause) && !qualifiedAgreement.test(c.clause) && !findFeatureMentions(c.clause, true).length)
    const conflicting = relevant.some(c => qualifiedAgreement.test(c.clause) || (!explicitExclusion.test(c.clause) && /\b(?:included|includes|provide|provided|deliver|delivered)\b/i.test(c.clause)))
    if (excludedClause && conflicting) {
      return { task, verdict: 'needs-review', requestEvidence, agreementEvidence: excludedClause.clause.slice(0, 350), explanation: 'Related agreement clauses are optional, qualified or conflicting. Confirm the agreed deliverables.' }
    }
    if (excludedClause && (additionRequest.test(task) || revisionRequest.test(task))) {
      return { task, verdict: 'potential-change', requestEvidence, agreementEvidence: excludedClause.clause.slice(0, 350), explanation: 'The agreement appears to explicitly exclude a related deliverable. Verify the wording and discuss the request before proceeding.' }
    }
    for (const feature of requested) {
      const orig = originalMentions.filter(m => m.feature === feature.feature)
      const included = orig.find(m => m.intent === 'addition')
      const excluded = orig.find(m => m.intent === 'excluded')
      if (orig.some(m => m.intent === 'uncertain') || (included && excluded)) {
        return { task, verdict: 'needs-review', requestEvidence, agreementEvidence: orig[0]?.context.slice(0, 350), explanation: 'The agreement contains uncertain or conflicting wording for this capability.' }
      }
      if (excluded && !included) {
        return { task, verdict: 'potential-change', requestEvidence, agreementEvidence: excluded.context.slice(0, 350), explanation: `${feature.feature} appears excluded in the agreement. Confirm the exact wording and whether this is a separately agreed change.` }
      }
      if (included && !excluded && !orig.some(m => m.intent === 'uncertain')) {
        return { task, verdict: 'likely-covered', requestEvidence, agreementEvidence: included.context.slice(0, 350), explanation: `${feature.feature} is mentioned as a deliverable in the agreement. Check limits, quantities and implementation details before treating this request as included.` }
      }
      if (!orig.length) {
        return { task, verdict: 'potential-change', requestEvidence, explanation: `${feature.feature} is requested, but the rules found no explicit matching feature in the agreement. This is a possible addition, not a contractual verdict.` }
      }
    }
    if (excludedInRequest.length) {
      return { task, verdict: 'needs-review', requestEvidence, explanation: 'The request contains exclusion wording, not a clear new deliverable. Confirm the intended change.' }
    }
    const coveredClause = [...candidates, ...relevant].find(c => !explicitExclusion.test(c.clause) && !qualifiedAgreement.test(c.clause) && ((revisionRequest.test(task) && revisionScope.test(c.clause)) || (additionRequest.test(task) && deliverableScope.test(c.clause))))
    if (coveredClause) {
      return { task, verdict: 'likely-covered', requestEvidence, agreementEvidence: coveredClause.clause.slice(0, 350), explanation: 'A related task is explicitly described in the agreement. Confirm any revision limits, specifications and quantities.' }
    }
    return { task, verdict: 'needs-review', requestEvidence, explanation: 'The rules cannot establish whether this individual task is included. Ask for details and compare it with the agreement manually.' }
  })
  return { tasks, omitted }
}
