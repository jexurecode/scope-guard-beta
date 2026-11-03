import type { Analysis, DetectedChange } from '../types/analysis'
import { features } from './feature-catalog'
import { clarificationNotes } from './clarification'
import { findFeatureMentions } from './feature-context'

// Preserve existing imports and history shape for Phase 1/2 consumers.
export type { Analysis, DetectedChange } from '../types/analysis'

export function analyzeScope(agreement: string, request: string): Analysis {
  const agreementMentions = findFeatureMentions(agreement, true)
  const requestMentions = findFeatureMentions(request)
  const detectedChanges: DetectedChange[] = []
  const reviewNotes: string[] = clarificationNotes(request)

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
    detectedChanges.push({
      feature: feature.name,
      requestEvidence: match.evidence,
      explanation: `Addition wording was matched in "${match.context}". ${originalExcluded ? 'Matching agreement terms appear in exclusion wording.' : 'No matching feature term was found in the agreement.'} This is a preliminary suggestion requiring human review.`,
    })
  }

  if (detectedChanges.length) {
    return {
      status: 'potential-change',
      title: 'Potential scope change detected',
      explanation: 'Keyword and context rules identified possible additions below. These preliminary suggestions require human review; they do not establish what the agreement covers.',
      detectedChanges,
      reviewNotes,
      reply: `Thanks for sharing this request! I'd be happy to discuss the requested ${detectedChanges.map(change => change.feature.toLowerCase()).join(' and ')}. This functionality may extend beyond the original deliverables. Let me review the requirements and our agreement with you before we confirm scope, timing, or any separate estimate.`,
    }
  }
  return {
    status: 'needs-review',
    title: 'Manual review recommended',
    explanation: reviewNotes.length ? 'No clear new feature additions were identified. Specific details need clarification before deciding whether the request is within scope.' : 'No clear new feature additions were identified by these keyword and context rules. This preliminary result does not confirm that the request is within scope. Review the agreement and clarify any uncertain wording.',
    detectedChanges,
    reviewNotes,
    reply: reviewNotes.length ? "Thanks for the update! Could you clarify exactly what you'd like added, including any additional items and how they should work? I'll compare those details with our original agreement before confirming scope and timing." : "Thanks for the update! Let me review this against our original agreement and clarify the requested changes so we can confirm whether they are included or need a separate discussion.",
  }
}
