import { Lock } from 'lucide-react'
import { SIDEBAR_ITEMS } from '../../lib/navigation'
import type { View } from '../../lib/navigation'
import { Logo } from './Logo'

type Props = { view: View; onNavigate: (view: View) => void }

export function Sidebar({ view, onNavigate }: Props) {
  return (
    <aside className="sidebar-gradient hidden text-white lg:sticky lg:top-0 lg:flex lg:h-dvh lg:w-72 lg:shrink-0 lg:flex-col">
      <div className="px-6 pb-7 pt-7"><Logo tagline /></div>
      <nav aria-label="Main navigation" className="flex-1 px-4">
        <ul className="space-y-1.5">
          {SIDEBAR_ITEMS.map(({ id, label, icon: Icon }) => (
            <li key={id}>
              <button
                type="button"
                onClick={() => onNavigate(id)}
                aria-current={view === id ? 'page' : undefined}
                className={`flex min-h-12 w-full items-center gap-3 rounded-xl px-4 text-left text-sm font-medium transition-colors focus-visible:outline-brand-300 ${view === id ? 'sidebar-active text-white' : 'text-brand-100 hover:bg-white/10 hover:text-white'}`}
              >
                <Icon size={19} aria-hidden="true" />
                {label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <div className="m-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs leading-5 text-brand-200">
        <p className="mb-1 flex items-center gap-2 font-semibold text-white"><Lock size={14} aria-hidden="true" /> Local workspace</p>
        Free local beta. No accounts or external services; your data stays in this browser.
      </div>
    </aside>
  )
}
