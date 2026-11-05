import type { Project } from '../types/workspace'
export function duplicateProject(projects: Project[], name: string) {
  return projects.find(p => p.name.trim().toLowerCase() === name.trim().toLowerCase())
}
export function agreementPreview(agreement: string) {
  const text = agreement.trim().replace(/\s+/g, ' ')
  return text.length > 175 ? text.slice(0, 174) + '…' : text
}
