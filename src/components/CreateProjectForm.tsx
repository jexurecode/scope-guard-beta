import { useState } from 'react'
import { Plus } from 'lucide-react'
import { LIMITS } from '../lib/workspace'

type Props = { onCreate: (name: string) => void; id?: string }

export function CreateProjectForm({ onCreate, id = 'new-project' }: Props) {
  const [name, setName] = useState('')
  return (
    <form className="flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={e => { e.preventDefault(); if (name.trim()) { onCreate(name); setName('') } }}>
      <div className="min-w-0 flex-1">
        <label htmlFor={id} className="field-label">New project name <span className="font-normal text-muted">(up to {LIMITS.name} characters)</span></label>
        <input id={id} className="field" placeholder="e.g. Acme website" value={name} onChange={e => setName(e.target.value)} maxLength={LIMITS.name} required />
      </div>
      <button type="submit" className="btn btn-primary" disabled={!name.trim()}><Plus size={16} aria-hidden="true" /> Create project</button>
    </form>
  )
}
