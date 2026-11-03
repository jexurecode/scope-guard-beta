import { Database, Moon, ShieldCheck, Sun } from 'lucide-react'
import { formatBytes } from '../lib/format'
import type { PageProps, ThemeProps } from './page-props'

type Props = Pick<PageProps, 'scope'> & ThemeProps

const OPTIONS = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
] as const

export function SettingsPage({ scope, theme, onThemeChange }: Props) {
  const { projects, analyses } = scope.data
  const size = formatBytes(new TextEncoder().encode(JSON.stringify(scope.data)).length)
  const rows: [string, string][] = [
    ['Projects', String(projects.length)],
    ['Saved analyses', String(analyses.length)],
    ['Approximate size', size],
    ['Status', scope.storageError ? 'Not saved to browser' : 'Saved in this browser'],
  ]
  return (
    <div className="max-w-3xl space-y-5">
      <section className="card p-5 sm:p-6" aria-labelledby="appearance-heading">
        <h2 id="appearance-heading" className="text-lg font-semibold text-fg">Appearance</h2>
        <p className="mt-1 text-sm text-muted">Light mode is the default. Your manual choice is remembered in this browser.</p>
        <div role="group" aria-label="Theme" className="mt-4 inline-flex rounded-xl border border-line bg-surface-2 p-1">
          {OPTIONS.map(({ value, label, icon: Icon }) => (
            <button key={value} type="button" aria-pressed={theme === value} onClick={() => onThemeChange(value)} className={`inline-flex min-h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold transition-colors ${theme === value ? 'bg-brand-600 text-white shadow-sm' : 'text-muted hover:text-fg'}`}>
              <Icon size={16} aria-hidden="true" />{label}
            </button>
          ))}
        </div>
      </section>

      <section className="card p-5 sm:p-6" aria-labelledby="data-heading">
        <h2 id="data-heading" className="flex items-center gap-2 text-lg font-semibold text-fg"><Database size={19} className="text-tint-fg" aria-hidden="true" /> Local data</h2>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          {rows.map(([term, value]) => (
            <div key={term} className="rounded-xl border border-line bg-surface-2 p-3">
              <dt className="text-xs text-muted">{term}</dt>
              <dd className="mt-0.5 text-sm font-semibold text-fg">{value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-sm leading-6 text-muted">Projects, agreements, analyses, and edited replies are stored only in this browser's local storage. Clearing site data removes them. Nothing is sent to a server.</p>
      </section>

      <section className="card p-5 sm:p-6" aria-labelledby="privacy-heading">
        <h2 id="privacy-heading" className="flex items-center gap-2 text-lg font-semibold text-fg"><ShieldCheck size={19} className="text-tint-fg" aria-hidden="true" /> Privacy &amp; limitations</h2>
        <p className="mt-2 text-sm leading-6 text-muted">This prototype uses heuristic keyword rules, not AI or legal analysis. Review every result yourself. Local storage is not secure storage, so avoid keeping highly confidential contracts here.</p>
      </section>
    </div>
  )
}
