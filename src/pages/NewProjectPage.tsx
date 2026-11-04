import { useState } from 'react'
import { LIMITS } from '../lib/workspace'
import { duplicateProject } from '../lib/project-experience'
import type { PageProps } from './page-props'
export function NewProjectPage({ scope, navigate }: PageProps) {
  const [name, setName] = useState('')
  const [creationError, setCreationError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const duplicate = duplicateProject(scope.data.projects, name)
  function create(separate = false) {
    setCreationError('')
    setSubmitted(true)
    if (!name.trim() || (duplicate && !separate)) return
    try {
      if (scope.createProject(name, separate)) navigate('project')
    } catch {
      setCreationError('Could not create the project. Your existing projects are unchanged. Try an updated browser or open the app through HTTPS, then retry.')
    }
  }
  return <section className="card space-y-5 p-5 sm:p-6"><h2 className="text-lg font-semibold">Create a project</h2>
    <form className="space-y-4" onSubmit={e => { e.preventDefault(); create() }}><label htmlFor="project-name" className="field-label">Project name</label><input id="project-name" className="field" maxLength={LIMITS.name} required value={name} onChange={e => { setName(e.target.value); setSubmitted(false); setCreationError('') }} /><button className="btn btn-primary" disabled={!name.trim()}>Create project</button></form>
    {creationError && <p role="alert" className="rounded-xl border border-line bg-danger-bg p-4 text-sm text-danger-fg">{creationError}</p>}
    {submitted && duplicate && <div role="alert" className="space-y-3 rounded-xl border border-line p-4"><p>A project named “{duplicate.name}” already exists. Is this another request for that engagement?</p><div className="flex flex-wrap gap-3"><button className="btn btn-primary" onClick={() => { scope.selectProject(duplicate.id); navigate('analysis') }}>Add a new client request to existing project</button><button className="btn btn-secondary" onClick={() => create(true)}>Create separate project for a different engagement</button></div></div>}
    <button className="btn btn-secondary" onClick={() => navigate('projects')}>Back to projects</button>
  </section>
}
