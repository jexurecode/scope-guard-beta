
export type DetectedChange = {
  feature: string
  requestEvidence: string
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
}

