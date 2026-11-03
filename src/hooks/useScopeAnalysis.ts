import { useEffect, useRef, useState } from 'react'
import { createSavedAnalysis, LIMITS, loadWorkspace, removeProject, saveWorkspace, validateInputs } from '../lib/workspace'
import type { Workspace } from '../types/workspace'
import { heuristicProvider } from '../lib/analysis-provider'
import type { AnalysisProvider } from '../lib/analysis-provider'

export function useScopeAnalysis(provider: AnalysisProvider = heuristicProvider) {
  const [initial] = useState(loadWorkspace)
  const [data, setData] = useState(initial.data)
  const [storageError, setStorageError] = useState(initial.error)
  const [storageBlocked, setStorageBlocked] = useState(!!initial.error)
  const [projectId, setProjectId] = useState(initial.data.projects[0]?.id ?? '')
  const [request, setRequest] = useState('')
  const [sampleVisible, setSampleVisible] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const generation = useRef(0)
  useEffect(() => () => { generation.current++ }, [])
  const project = data.projects.find(p => p.id === projectId)
  const active = data.analyses.find(a => a.id === activeId)
  const agreement = active?.agreement ?? project?.agreement ?? ''

  function persist(next: Workspace) {
    setData(next)
    if (!storageBlocked) setStorageError(saveWorkspace(next))
  }
  function clearView() {
    generation.current++
    setLoading(false)
    setActiveId(null)
    setCopied(false)
    setError(null)
    setSampleVisible(false)
  }
  function selectProject(id: string) {
    clearView()
    setProjectId(id)
    setRequest('')
  }
  function createProject(name: string) {
    if (!name.trim() || name.trim().length > LIMITS.name) return
    const id = crypto.randomUUID()
    persist({ ...data, projects: [...data.projects, { id, name: name.trim(), agreement: '' }] })
    selectProject(id)
  }
  function renameProject(name: string) {
    if (!project || !name.trim() || name.trim().length > LIMITS.name) return
    if (loading) clearView()
    persist({ ...data, projects: data.projects.map(p => p.id === projectId ? { ...p, name: name.trim() } : p) })
  }
  function deleteProject() {
    const next = removeProject(data, projectId)
    persist(next)
    selectProject(next.projects[0]?.id ?? '')
  }
  function updateAgreement(value: string) {
    if (!project || value.length > LIMITS.agreement) return
    clearView()
    persist({ ...data, projects: data.projects.map(p => p.id === projectId ? { ...p, agreement: value } : p) })
  }
  function updateRequest(value: string) {
    if (value.length > LIMITS.request) return
    clearView()
    setRequest(value)
  }
  async function handleAnalyze() {
    if (!project || loading) return
    const validation = validateInputs(agreement, request)
    if (validation) { setError(validation); return }
    clearView()
    const ticket = generation.current
    setLoading(true)
    // Yield for the loading state; the current provider is entirely local.
    await new Promise<void>(resolve => setTimeout(resolve, 0))
    if (ticket !== generation.current) return
    try {
      const result = await provider.analyze({ agreement, request })
      if (ticket !== generation.current) return
      const saved = createSavedAnalysis(projectId, agreement, request, result)
      persist({ ...data, analyses: [saved, ...data.analyses] })
      setActiveId(saved.id)
    } catch {
      if (ticket === generation.current) setError('Analysis could not be completed. Your inputs are still available; please retry.')
    } finally {
      if (ticket === generation.current) setLoading(false)
    }
  }
  function reopen(id: string) {
    // History and the dashboard list analyses from every project, so reopening
    // must also switch to the project the analysis belongs to.
    const saved = data.analyses.find(a => a.id === id)
    if (!saved || !data.projects.some(p => p.id === saved.projectId)) return
    clearView()
    setProjectId(saved.projectId)
    setActiveId(id)
    setRequest(saved.request)
  }
  function updateReply(reply: string) {
    if (!active || reply.length > LIMITS.reply) return
    generation.current++
    setCopied(false)
    persist({ ...data, analyses: data.analyses.map(a => a.id === active.id ? { ...a, result: { ...a.result, reply } } : a) })
  }
  async function copyReply() {
    if (!active) return
    setError(null)
    const ticket = generation.current
    try {
      await navigator.clipboard.writeText(active.result.reply)
      if (ticket === generation.current) setCopied(true)
    } catch {
      if (ticket === generation.current) setError('Could not copy. Select the response text and copy it manually.')
    }
  }
  function reset() { clearView(); setRequest('') }
  function loadExample() { setSampleVisible(true) }
  function closeExample() { setSampleVisible(false) }
  function retrySave() {
    const failure = saveWorkspace(data)
    setStorageError(failure)
    if (!failure) setStorageBlocked(false)
  }
  return { data, project, projectId, agreement, request, active, copied, error, loading, storageError, storageBlocked,
    history: data.analyses.filter(a => a.projectId === projectId),
    canAnalyze: !!project && !loading && !validateInputs(agreement, request),
    selectProject, createProject, renameProject, deleteProject, updateAgreement, updateRequest,
    handleAnalyze, reopen, updateReply, copyReply, reset, loadExample, closeExample, sampleVisible, retrySave }
}

export type ScopeState = ReturnType<typeof useScopeAnalysis>
