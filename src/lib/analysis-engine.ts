import type { Analysis, DetectedChange } from '../types/analysis'
import { features } from './feature-catalog'
import { capabilityClarificationNotes, clarificationNotes } from './clarification'
import { findFeatureMentions } from './feature-context'
import { assessClientTasks } from './task-analysis'

// Preserve existing imports and history shape for Phase 1/2 consumers.
export type { Analysis, DetectedChange } from '../types/analysis'

export function analyzeScope(agreement: string, request: string): Analysis {
  const agreementMentions = findFeatureMentions(agreement, true)
  const requestMentions = findFeatureMentions(request)
  const detectedChanges: DetectedChange[] = []
  const reviewNotes: string[] = [...clarificationNotes(request), ...capabilityClarificationNotes(agreement, request)]
  const { tasks, omitted } = assessClientTasks(agreement, request)
  if (omitted) reviewNotes.push(`${omitted} additional client task(s) were not individually assessed (limit 24). Review the full request manually.`)

  for (const feature of features) {
    const requested = requestMentions.filter(mention => mention.feature === feature.name)
    if (!requested.length) continue
    const additions = requested.filter(mention => mention.intent === 'addition')
    const excluded = requested.some(mention => mention.intent === 'excluded')
    const uncertain = requested.some(mention => mention.intent === 'uncertain')
    const evidence = requested[0].evidence
    if ((additions.length && excluded) || uncertain) {
      reviewNotes.push(`${feature.name}: "${evidence}" has uncertain, modification, or conflicting wording. Clarify the intended change; no new addition is inferred for this feature.`)
      continue
    }
    if (!additions.length) {
      reviewNotes.push(`${feature.name}: exclusion or removal wording was found near "${evidence}". It is not treated as an addition; removals may still change scope and require review.`)
      continue
    }
    const original = agreementMentions.filter(mention => mention.feature === feature.name)
    const included = original.some(mention => mention.intent === 'addition')
    const originalExcluded = original.some(mention => mention.intent === 'excluded')
    if (original.some(mention => mention.intent === 'uncertain') || (included && originalExcluded)) {
      reviewNotes.push(`${feature.name}: the agreement contains uncertain or conflicting wording. Verify the actual deliverables before deciding whether this request is new.`)
      continue
    }
    if (included) {
      reviewNotes.push(`${feature.name}: a related term also appears in the agreement. No new feature group is flagged, but details, quantities, and changes to existing work still need review.`)
      continue
    }
    const match = additions[0]
    const capability = feature.name === 'Admin dashboard' || feature.name === 'Content management system'
    detectedChanges.push({
      feature: feature.name,
      requestEvidence: match.evidence,
      agreementEvidence: originalExcluded ? original.find(mention => mention.intent === 'excluded')?.context.slice(0, 350) : undefined,
      explanation: capability
        ? `The client appears to request ${feature.name === 'Admin dashboard' ? 'an admin interface' : 'a content editing system'}, not just a one-time update to website content. ${originalExcluded ? 'Related capability appears in the agreement exclusion wording.' : 'This capability was not explicitly identified in the agreement.'} Confirm what editing is needed and review the agreed deliverables; this is not a contractual determination.`
        : `Possible addition indicated by "${match.evidence}". ${originalExcluded ? 'Related functionality appears in the agreement exclusion wording.' : 'No matching feature category was identified in the agreement.'} Check the precise deliverables before deciding whether this changes scope.`,
    })
  }

  // Preserve uncatalogued exclusion findings even when a known capability is
  // mentioned in the same request. Task evidence remains the source of truth.
  for (const task of tasks.filter(t => t.verdict === 'potential-change' && t.agreementEvidence)) {
    if (!detectedChanges.some(c => task.explanation.startsWith(c.feature))) {
      detectedChanges.push({ feature: task.task.replace(/^(?:please\s+)?(?:add|build|create|develop|implement|integrate|enable|include|install|update|edit|change|replace)\s+(?:(?:a|an|the)\s+)?/i, '').slice(0, 120), requestEvidence: task.requestEvidence, agreementEvidence: task.agreementEvidence, explanation: task.explanation })
    }
  }
  if (detectedChanges.length) {
    const adminDetected = detectedChanges.some(change => change.feature === 'Admin dashboard' || change.feature === 'Content management system')
    return {
      status: 'potential-change',
      title: 'Potential scope change detected',
      explanation: 'Keyword and context rules identified possible additions below. These preliminary suggestions require human review; they do not establish what the agreement covers.',
      detectedChanges,
      reviewNotes,
      tasks,
      reply: !adminDetected && tasks.length > 1
        ? `Thanks for breaking down the requested tasks. Some may match our agreement, while others may involve additional scope. In particular, the ${detectedChanges.map(change => change.feature.toLowerCase()).join(' and ')} may be an addition. Could you clarify what the requested ${detectedChanges.map(change => change.requestEvidence.toLowerCase()).join(' and ')} should do? I'll cross-check the agreed deliverables, including any exclusions and revision limits, before we confirm timing or a separate estimate.`
        : adminDetected
        ? `Thanks for the request! When you mention the admin/content editing feature, do you mean you'd like me to update the website content for you, or do you need an interface where you can edit the content yourself? If it's an interface, please confirm which content needs editing and who should have access. I'll compare those requirements with our original agreement before confirming scope, timing, or any additional estimate.`
        : `Thanks for sharing this request! I'd be happy to discuss the requested ${detectedChanges.map(change => change.feature.toLowerCase()).join(' and ')}. This functionality may extend beyond the original deliverables. Let me review the requirements and our agreement with you before we confirm scope, timing, or any separate estimate.`,
    }
  }
  const taskFlags = tasks.filter(task => task.verdict === 'potential-change')
  if (taskFlags.length) {
    return {
      status: 'potential-change',
      title: 'Potential scope change requires review',
      explanation: 'A task appears to conflict with an explicit agreement exclusion, but it does not map cleanly to the built-in feature catalog. Review the quoted agreement evidence before making a decision.',
      detectedChanges,
      reviewNotes,
      tasks,
      reply: `Thanks for the details. I want to clarify the request for ${taskFlags.slice(0, 2).map(t => t.task.slice(0, 120)).join(' and ')} because a related item appears excluded in the original agreement. Could we confirm exactly what is needed before discussing a scope or timeline change?`,
    }
  }
  return {
    status: 'needs-review',
    title: 'Manual review recommended',
    explanation: reviewNotes.length ? 'No clear new feature additions were identified. Specific details need clarification before deciding whether the request is within scope.' : 'No clear new feature additions were identified by these keyword and context rules. This preliminary result does not confirm that the request is within scope. Review the agreement and clarify any uncertain wording.',
    detectedChanges,
    reviewNotes,
    tasks,
    reply: reviewNotes.some(note => note.includes('admin'))
      ? "Thanks for the request! Do you mean a one-time update to the website, or an admin interface where you can edit the content yourself? Which parts should be editable? I'll check those requirements against the original agreement before confirming scope and timing."
      : reviewNotes.some(note => note.includes('Repository details'))
        ? "Thanks! Could you clarify whether you want a GitHub profile link, project links, or a live integration? Please also list any other additions so I can check them against our agreed deliverables."
        : reviewNotes.length ? "Thanks for the update! Could you clarify exactly what you'd like added, including any additional items and how they should work? I'll compare those details with our original agreement before confirming scope and timing." : "Thanks for the update! Let me review this against our original agreement and clarify the requested changes so we can confirm whether they are included or need a separate discussion.",
  }
}
