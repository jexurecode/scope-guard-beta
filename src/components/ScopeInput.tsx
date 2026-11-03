import { useLayoutEffect, useRef } from 'react'
import type { LucideIcon } from 'lucide-react'

type Props = {
  id: string
  title: string
  label: string
  placeholder: string
  value: string
  onChange: (value: string) => void
  maxLength: number
  readOnly?: boolean
  icon: LucideIcon
}

export function ScopeInput({ id, title, label, placeholder, value, onChange, maxLength, readOnly = false, icon: Icon }: Props) {
  const areaRef = useRef<HTMLTextAreaElement>(null)
  useLayoutEffect(() => {
    const el = areaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(Math.max(el.scrollHeight, 112), 360)}px`
  }, [value])
  return (
    <section className="card p-5 sm:p-6">
      <div className="mb-4 flex items-center gap-3">
        <span className="icon-tile"><Icon size={20} aria-hidden="true" /></span>
        <h3 className="text-base font-semibold text-fg">{title}</h3>
      </div>
      <label htmlFor={id} className="field-label">{label}</label>
      <textarea
        ref={areaRef}
        id={id}
        value={value}
        maxLength={maxLength}
        readOnly={readOnly}
        aria-describedby={`${id}-count`}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="field min-h-28 max-h-[360px] resize-y overflow-y-auto leading-6"
      />
      <p id={`${id}-count`} className="mt-2 text-xs text-muted">{value.length.toLocaleString()} / {maxLength.toLocaleString()} characters{readOnly ? ' - Read only' : ''}</p>
    </section>
  )
}
