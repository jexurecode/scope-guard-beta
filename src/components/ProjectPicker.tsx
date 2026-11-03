import type { Project } from '../types/workspace'

type Props = { projects: Project[]; selected: string; onSelect: (id: string) => void; id?: string; label?: string; allowAll?: boolean }

/** Native select: reliable on touch devices and fully keyboard accessible. */
export function ProjectPicker({ projects, selected, onSelect, id = 'project', label = 'Project', allowAll = false }: Props) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="field-label">{label}</label>
      <select id={id} value={selected} onChange={e => onSelect(e.target.value)} className="field">
        {allowAll && <option value="all">All projects</option>}
        {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
    </div>
  )
}
