import { features } from './feature-catalog'

type Intent = 'addition' | 'excluded' | 'uncertain'
export type FeatureMention = {
  feature: string
  evidence: string
  context: string
  intent: Intent
}

// These are bounded English wording rules, not a grammar or contract parser.
const addition = /\b(?:add|addition|build|implement|integrate|include|enable|create|develop|introduce|install|want|need|require|provide|support|allow|accept|purchase|buy|sell|book|schedule|would like)\b/g
const exclusion = /\b(?:(?:do|does|did|will|would|should|can|could|must)\s+not|cannot|never|no|not|without|except|exclude(?:d|s)?|excluding|remove|removing|delete|deleting|omit|omitting|disable|drop|avoid|get rid of)\b/g
const uncertain = /\b(?:maybe|perhaps|possibly|potentially|might|consider|considering|discuss|explore|whether|if|unless|optional|optionally|later|someday|eventually|future|not sure|not only|not just|not necessarily|not opposed|not against|no objection|instead of|rather than|replace|replacement|either|should we|should i|do we need|do i need|would we need|can you confirm)\b|\bor\b|["\u201c\u201d]|(?:^|\s)'|'(?:\s|$)/
const modification = /\b(?:change|update|fix|repair|redesign|recolor|restyle|rename|move|keep|retain|existing|already|current)\b|\b(?:button|label|icon|logo|font|colou?r|copy|wording|text|link|screenshot|mockup|mock-up|documentation|tutorial|article|invoice|receipt|terms|policy|example|sample)\b/
const suffixExclusion = /^\s*(?:(?:is|are|was|were|will be|should be)\s+)?(?:not\s+(?:be\s+)?(?:needed|required|included|wanted)|excluded|out of scope|unnecessary)\b|^\s*(?:has|have|had)\s+not\s+been\s+(?:included|covered|provided|required|needed)\b|^\s*(?:will|should|must)\s+not\s+be\s+(?:needed|required|included|wanted)\b/

function normalize(text: string): string {
  return text.toLowerCase()
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/\bwon't\b/g, 'will not')
    .replace(/\bcan't\b/g, 'cannot')
    .replace(/\bisn't\b/g, 'is not')
    .replace(/\baren't\b/g, 'are not')
    .replace(/\bwasn't\b/g, 'was not')
    .replace(/\bweren't\b/g, 'were not')
    .replace(/\bhasn't\b/g, 'has not')
    .replace(/\bhaven't\b/g, 'have not')
    .replace(/\bhadn't\b/g, 'had not')
    .replace(/\b(?:we|i)'d like\b/g, 'would like')
    .replace(/\b(don|doesn|didn|wouldn|shouldn|couldn|mustn)'t\b/g, (_, stem: string) => ({
      don: 'do', doesn: 'does', didn: 'did', wouldn: 'would', shouldn: 'should', couldn: 'could', mustn: 'must',
    }[stem] + ' not'))
    .replace(/\bsign-up\b/g, 'sign up')
    .replace(/\blog-in\b/g, 'log in')
    .replace(/\s+/g, ' ')
    .trim()
}

function commaClauses(text: string, agreement: boolean): string[] {
  if (!agreement) return text.split(',')
  const parts = text.split(',')
  const clauses: string[] = []
  let current = parts[0]
  for (const part of parts.slice(1)) {
    const next = normalize(part)
    const action = /^(?:(?:and|or)\s+)?(?:add|build|include|exclude|omit|remove|enable|disable|no|without)\b/.test(next)
    const previousPredicate = /\b(?:included|excluded|required|optional|out of scope)\s*$/i.test(current)
    const nextPredicate = /\b(?:is|are|included|excluded|required|optional)\b/.test(next)
    if (action || (previousPredicate && nextPredicate)) {
      clauses.push(current)
      current = part
    } else {
      // Preserve "No A, B, or C" and "A, B, and C are excluded".
      current += `,${part}`
    }
  }
  return [...clauses, current]
}

function clauses(text: string, agreement: boolean): { context: string; qualified: boolean }[] {
  // Keep lists together so "no store or payments" retains its exclusion.
  // Split a conjunction only when it introduces a new action, not a feature list.
  return text.split(/[.!?;\n\r]+/).flatMap(sentence => {
    const qualified = /^\s*(?:if|unless|assuming|provided|when|maybe|perhaps|possibly|potentially|consider|discuss|explore|should we|do we need|could we)\b/i.test(sentence) || /["\u201c\u201d]|(?:^|\s)'/.test(sentence)
    return sentence.split(/\b(?:but|however|yet)\b|(?=\b(?:without|except)\b)|\band\s+(?=(?:(?:please|also)\s+)*(?:add|build|include|enable|create|implement|integrate|remove|delete|exclude|omit|disable|do not|don't|don\u2019t|no|we (?:want|need)|we do not)\b)/i)
      .flatMap(part => commaClauses(part, agreement))
      .map(part => ({ context: normalize(part), qualified })).filter(part => part.context)
  })
}

function lastMatch(pattern: RegExp, text: string): number {
  // matchAll uses a copy: no global RegExp state leaks between analyses.
  return Array.from(text.matchAll(pattern)).at(-1)?.index ?? -1
}

function sharedListExclusion(context: string): boolean {
  const predicate = /\b(?:(?:is|are|was|were|will be|shall be)\s+(?:not\s+(?:included|required|needed)|excluded|out of scope)|(?:has|have|had)\s+not\s+been\s+(?:included|required|needed))\s*$/.exec(context)
  if (!predicate) return false
  const head = context.slice(0, predicate.index)
  // Only share a trailing predicate across a noun list, never across actions
  // such as "include payments and booking is excluded".
  return /,|\b(?:and|or)\b/.test(head)
    && lastMatch(addition, head) < 0
    && lastMatch(exclusion, head) < 0
    && !/\b(?:is|are|with|has|have|will|shall)\b/.test(head)
}

function classify(context: string, start: number, end: number, nextStart: number, agreement: boolean, qualified: boolean): Intent {
  const before = context.slice(0, start)
  const after = context.slice(end, nextStart)
  const negative = lastMatch(exclusion, before)
  const positive = lastMatch(addition, before)

  // Double negatives and compound qualifications need human interpretation.
  if (qualified || /\bnot\s+(?:exclude|remove|delete|omit|disable|avoid|without)\b/.test(before) || /\bnot only\b|\bnot just\b|\bnot opposed\b|\bno objection\b/.test(context)) return 'uncertain'
  // An explicit exclusion is distinct from "maybe excluded". Ignore only the
  // list connector "or" here; all other uncertainty rules still take priority.
  if (agreement && (
    uncertain.test(context.replace(/\bor\b/g, ''))
    || /\b(?:may|might|could)\b/.test(context)
    || /\bnot\s+excluded\b|\b(?:included\s+and\s+excluded|excluded\s+and\s+included)\b/.test(context)
  )) return 'uncertain'
  if (agreement && sharedListExclusion(context)) return 'excluded'
  if (suffixExclusion.test(after)) return 'excluded'
  // Passive agreement exclusions: \"booking systems are excluded\" and \"payment integrations are not included\".
  if (agreement && /^\s*(?:(?:systems?|functionality|features?|services?|integrations?)\s+)?(?:(?:are|is|was|were|will be|shall be)\s+(?:excluded|not included|out of scope)|(?:has|have|had)\s+not\s+been\s+(?:included|covered|provided))\b/.test(after)) return 'excluded'
  // "Do not add" contains an addition verb; the negation still governs it.
  if (negative >= 0) return 'excluded'
  if (uncertain.test(context)) return 'uncertain'
  // A vague 'admin tag' could mean a simple label, not an editing system.
  if (context.slice(start, end) === 'admin tag' && !/\b(?:edit|editing|manage|managing)\b/.test(context)) return 'uncertain'
  // An explicitly requested admin editing interface is a new capability, not merely
  // a request to update existing page text. Avoid treating links/logos as systems.
  if (modification.test(context) && !(/\b(?:blog|blogging|article pages|page for each article)\b/.test(context) && !/\b(?:link|logo|icon|button|text|copy|example|sample|update|edit)\b/.test(context)) && !(/\b(?:admin|cms|content editor)\b/.test(context) && /\b(?:edit|editing|manage|managing)\b/.test(context) && /\b(?:content|website|web info|site info|information)\b/.test(context) && !/\b(?:link|logo|icon|button|screenshot|mockup)\b/.test(context))) return 'uncertain'
  if (agreement) return 'addition' // A plain deliverable list counts as a mention, never proof of coverage.
  if (positive >= 0) return 'addition'
  // Feature-first phrasing: "Payments are required" / "booking is needed".
  if (/^\s*(?:(?:is|are)\s+)?(?:required|needed|wanted)\b/.test(after)) return 'addition'
  // Capability questions such as "Can customers purchase products?" have the
  // action inside the matched alias, rather than strictly before it.
  if (/\b(?:purchase|buy|sell|accept|book|schedule)\b/.test(context.slice(start, end)) && /\b(?:can|could|allow|enable|let)\b/.test(before)) return 'addition'
  return 'uncertain'
}

export function findFeatureMentions(text: string, agreement = false): FeatureMention[] {
  const mentions: FeatureMention[] = []
  for (const { context, qualified } of clauses(text, agreement)) {
    const matches = features.flatMap(feature => feature.keywords.flatMap(keyword => {
      const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const pattern = new RegExp(`\\b${escaped.replace(/ /g, '\\s+')}\\b`, 'g')
      return Array.from(context.matchAll(pattern), match => ({ feature: feature.name, evidence: match[0], start: match.index, end: match.index + match[0].length }))
    })).sort((a, b) => a.start - b.start || b.end - a.end)

    // Prefer the longest alias at a location and avoid duplicate overlapping terms.
    const ends = new Map<string, number>()
    const unique = matches.filter(match => {
      if ((ends.get(match.feature) ?? -1) >= match.end) return false
      ends.set(match.feature, match.end)
      return true
    })
    for (const [index, match] of unique.entries()) {
      mentions.push({
        feature: match.feature,
        evidence: match.evidence,
        context,
        intent: classify(context, match.start, match.end, unique[index + 1]?.start ?? context.length, agreement, qualified),
      })
    }
  }
  return mentions
}
