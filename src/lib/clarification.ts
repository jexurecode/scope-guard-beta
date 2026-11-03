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
