import { useLayoutEffect, useRef, useState } from 'react'
import { FileUp } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { ACCEPTED_DOCUMENTS, type ImportResult } from '../lib/document-import'

type Props = {
  id: string
  title: string
  label: string
  placeholder: string
  value: string
  onChange: (value: string) => void
  onImport?: (file: File) => Promise<ImportResult>
  maxLength: number
  readOnly?: boolean
  icon: LucideIcon
}

export function ScopeInput({ id, title, label, placeholder, value, onChange, onImport, maxLength, readOnly = false, icon: Icon }: Props) {
  const areaRef = useRef<HTMLTextAreaElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [imported, setImported] = useState<ImportResult | null>(null)
  useLayoutEffect(() => {
    const el = areaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(Math.max(el.scrollHeight, 112), 360)}px`
  }, [value])
  async function handleFile(file?: File) {
    if (!file || !onImport || readOnly || importing) return
    setImportError(null)
    setImported(null)
    setImporting(true)
    try {
      const result = await onImport(file)
      setImported(result)
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'File import failed.')
    } finally {
      if (fileRef.current) fileRef.current.value = ''
      setImporting(false)
    }
  }
  return (
    <section className="card p-5 sm:p-6">
      <div className="mb-4 flex items-center gap-3">
        <span className="icon-tile"><Icon size={20} aria-hidden="true" /></span>
        <h3 className="text-base font-semibold text-fg">{title}</h3>
      </div>
      <label htmlFor={id} className="field-label">{label}</label>
      {onImport && <div className="mt-2 mb-3 flex flex-wrap items-center gap-2">
        <input ref={fileRef} id={`${id}-file`} type="file" accept={ACCEPTED_DOCUMENTS} disabled={readOnly || importing} className="sr-only" aria-label={`Import ${title.toLowerCase()} file`} onChange={e => { void handleFile(e.target.files?.[0]) }} />
        <button type="button" className="btn btn-secondary min-h-9 px-3 text-xs" disabled={readOnly || importing} onClick={() => fileRef.current?.click()}><FileUp size={16} aria-hidden="true" />{importing ? 'Reading locally...' : 'Import PDF, DOCX or TXT'}</button>
        <span className="text-xs text-muted">Replaces the text below; no file upload to a server.</span>
      </div>}
      {importError && <p role="alert" className="mb-2 rounded-lg bg-danger-bg p-3 text-xs text-danger-fg">{importError}</p>}
      {imported && <div role="status" className="mb-3 rounded-lg border border-info-line bg-info-bg p-3 text-xs leading-5 text-info-fg">
        <p>Imported "{imported.fileName}" ({imported.text.length.toLocaleString()} characters). Read the extracted text carefully before analysis.</p>
        {imported.warnings.map(w => <p key={w} className="mt-1">⚠ {w}</p>)}
      </div>}
      <textarea
        ref={areaRef}
        id={id}
        value={value}
        maxLength={maxLength}
        readOnly={readOnly || importing}
        aria-describedby={`${id}-count`}
        onChange={(event) => { setImported(null); onChange(event.target.value) }}
        placeholder={placeholder}
        className="field min-h-28 max-h-[360px] resize-y overflow-y-auto leading-6"
      />
      <p id={`${id}-count`} className="mt-2 text-xs text-muted">{value.length.toLocaleString()} / {maxLength.toLocaleString()} characters{readOnly ? ' - Read only' : ''}</p>
    </section>
  )
}
