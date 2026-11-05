
import type { TaskAssessment } from '../lib/task-analysis'

export type DetectedChange = {
  feature: string
  requestEvidence: string
  agreementEvidence?: string
  explanation: string
}

export type Analysis = {
  status: 'potential-change' | 'needs-review'
  title: string
  explanation: string
  reply: string
  detectedChanges: DetectedChange[]
  // Optional so analyses saved before context rules remain readable.
  reviewNotes?: string[]
  // Task-by-task assessments added in v0.8. Legacy snapshots omit this.
  tasks?: TaskAssessment[]
}

