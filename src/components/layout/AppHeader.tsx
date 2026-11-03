import { FolderKanban, Plus } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { PAGE_META } from '../../lib/navigation'
import type { View } from '../../lib/navigation'
import type { Theme } from '../../types/theme'
import { Logo } from './Logo'
import { WorkspaceTools } from './WorkspaceTools'
import type { NotificationReads } from '../../hooks/useNotificationReads'
import type { Workspace } from '../../types/workspace'
import { ThemeToggle } from './ThemeToggle'

type Props = { view: View; theme: Theme; onToggleTheme: () => void; onNavigate: (view: View) => void; data: Workspace; notifications: NotificationReads; onOpenAnalysis: (id: string) => void; onSelectProject: (id: string) => void }

type HeaderAction = { label: string; to: View; icon: LucideIcon; primary?: boolean }

const ACTIONS: Partial<Record<View, HeaderAction>> = {
  projects: { label: 'New analysis', to: 'analysis', icon: Plus, primary: true },
  history: { label: 'New analysis', to: 'analysis', icon: Plus, primary: true },
  analysis: { label: 'Manage projects', to: 'projects', icon: FolderKanban },
}

export function AppHeader({ view, theme, onToggleTheme, onNavigate, data, notifications, onOpenAnalysis, onSelectProject }: Props) {
  const meta = PAGE_META[view]
  const action = ACTIONS[view]
  return (
    <header className="border-b border-line bg-surface">
      {/* Compact mobile bar: branding + theme control */}
      <div className="flex items-center gap-3 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2 lg:hidden">
        <Logo />
        <div className="ml-auto flex items-center gap-2"><WorkspaceTools data={data} notifications={notifications} onNavigate={onNavigate} onOpenAnalysis={onOpenAnalysis} onSelectProject={onSelectProject} /><ThemeToggle theme={theme} onToggle={onToggleTheme} /></div>
      </div>
      <div className="mx-auto flex max-w-[1200px] items-center gap-4 px-4 pb-4 pt-2 sm:px-8 lg:py-5">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold tracking-tight text-fg lg:text-3xl">{meta.title}</h1>
          <p className="mt-1 hidden text-sm text-muted sm:block">{meta.description}</p>
        </div>
        <div className="flex items-center gap-3">
          {action && (
            <button type="button" onClick={() => onNavigate(action.to)} className={`btn hidden sm:inline-flex ${action.primary ? 'btn-primary' : 'btn-secondary'}`}>
              <action.icon size={16} aria-hidden="true" />{action.label}
            </button>
          )}
          <span className="hidden lg:block"><WorkspaceTools data={data} notifications={notifications} onNavigate={onNavigate} onOpenAnalysis={onOpenAnalysis} onSelectProject={onSelectProject} /></span>
          <span className="hidden lg:block"><ThemeToggle theme={theme} onToggle={onToggleTheme} /></span>
        </div>
      </div>
    </header>
  )
}
