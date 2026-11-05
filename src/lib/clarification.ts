/** Conservative English-language prompts for underspecified requests. */
export function clarificationNotes(request: string): string[] {
  const notes: string[] = []
  const text = request.slice(0, 12000)
  if (/\b(?:other\s+(?:stuff|stuffs|things|features|changes)|something\s+else|and\s+more|etc\.?|whatever\s+else)\b/i.test(text)) {
    notes.push('The request mentions unspecified additional work. Ask the client to list each item and its expected outcome before confirming scope or a quote.')
  }
  if (/\b(?:github(?:\.com)?|gitlab|bitbucket)\b/i.test(text) && /\b(?:add|include|show|link|integrate|connect|display|put)\b/i.test(text)) {
    notes.push('Repository details were mentioned. Clarify whether the client wants a simple profile link, project links, embedded repository content, or a live integration; these can require different amounts of work.')
  }
  return notes
}

/** Ask about capability boundaries without assuming the implementation. */
export function capabilityClarificationNotes(agreement: string, request: string): string[] {
  const notes: string[] = []
  const text = request.slice(0, 12000)
  const admin = /\b(?:admin\s+(?:tag|panel|dashboard|interface|area)|administration panel|back office|content management system|cms|content editor)\b/i.test(text)
  const editing = /\b(?:edit|editing|manage|managing|update|updating|change)\b/i.test(text)
  const content = /\b(?:content|website|web(?:site)?\s+info|site info|information|pages?|portfolio)\b/i.test(text)
  const explicitlyExcluded = /\b(?:do not|does not|don't|doesn't|no|without|exclude|remove|avoid)\s+(?:(?:want|need|add|include|require)\s+)?(?:an?\s+)?(?:admin|cms|content editor)\b/i.test(text)
  if (admin && !explicitlyExcluded && editing && content) {
    notes.push('Clarify whether the client wants you to make a one-time content update or wants their own editing interface (admin panel/CMS). If it is self-service, ask which pages or fields need editing, who can access them, and whether changes must be saved. Do not assume login or a database is required without confirmation.')
    if (/\b(?:complete|full|everything|all features)\b/i.test(agreement) && !/\b(?:admin|cms|content management|editor)\b/i.test(agreement)) {
      notes.push('The original agreement uses broad wording but does not explicitly describe an editing interface. Confirm the agreed deliverables before treating this as additional paid work.')
    }
  } else if (admin && !explicitlyExcluded) {
    notes.push('Clarify what the requested admin capability should do and whether it was included in the original deliverables; an admin link or label alone is not an admin system.')
  }
  return notes
}
