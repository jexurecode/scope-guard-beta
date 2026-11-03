import type { Analysis } from './analysis'

export type Project = { id: string; name: string; agreement: string }
export type SavedAnalysis = {
  id: string
  projectId: string
  createdAt: string
  agreement: string
  request: string
  result: Analysis
}
export type Workspace = { version: 1; projects: Project[]; analyses: SavedAnalysis[] }
