import { ChevronRight, Lock, Moon, Settings, Sun } from 'lucide-react'
import type { View } from '../lib/navigation'
import type { Theme } from '../types/theme'

type Props = { theme: Theme; onToggleTheme: () => void; navigate: (view: View) => void }

export function MorePage({ theme, onToggleTheme, navigate }: Props) {
  const next = theme === 'light' ? 'dark' : 'light'
  return (
    <div className="space-y-4">
      <ul className="card divide-y divide-line">
        <li>
          <button type="button" onClick={() => navigate('settings')} className="flex min-h-14 w-full items-center gap-3 rounded-2xl px-4 text-left transition-colors hover:bg-tint">
            <span className="icon-tile"><Settings size={19} aria-hidden="true" /></span>
            <span className="flex-1 text-sm font-semibold text-fg">Settings</span>
            <ChevronRight size={17} aria-hidden="true" className="text-muted" />
          </button>
        </li>
        <li>
          <button type="button" onClick={onToggleTheme} className="flex min-h-14 w-full items-center gap-3 rounded-2xl px-4 text-left transition-colors hover:bg-tint">
            <span className="icon-tile">{theme === 'light' ? <Moon size={19} aria-hidden="true" /> : <Sun size={19} aria-hidden="true" />}</span>
            <span className="flex-1 text-sm font-semibold text-fg">Switch to {next} mode</span>
          </button>
        </li>
      </ul>
      <p className="flex items-start gap-2 px-1 text-xs leading-5 text-muted"><Lock size={14} className="mt-0.5 shrink-0" aria-hidden="true" /> Free local beta. No accounts or external services; your data stays in this browser.</p>
    </div>
  )
}
