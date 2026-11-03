import { Ellipsis, FolderKanban, History, LayoutDashboard, ScanSearch, Settings } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type View = 'dashboard' | 'projects' | 'analysis' | 'history' | 'settings' | 'more'

export type NavItem = { id: View; label: string; icon: LucideIcon }

/** Desktop sidebar. */
export const SIDEBAR_ITEMS: readonly NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'projects', label: 'Projects', icon: FolderKanban },
  { id: 'analysis', label: 'New analysis', icon: ScanSearch },
  { id: 'history', label: 'History', icon: History },
  { id: 'settings', label: 'Settings', icon: Settings },
]

/** Mobile bottom navigation. Settings lives under "More". */
export const TAB_ITEMS: readonly NavItem[] = [
  { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
  { id: 'projects', label: 'Projects', icon: FolderKanban },
  { id: 'analysis', label: 'Analyze', icon: ScanSearch },
  { id: 'history', label: 'History', icon: History },
  { id: 'more', label: 'More', icon: Ellipsis },
]

export const PAGE_META: Record<View, { title: string; description: string }> = {
  dashboard: { title: 'Dashboard', description: 'Track your projects, analyze requests, and keep scope under control.' },
  projects: { title: 'Projects', description: 'Create projects and keep each original agreement up to date.' },
  analysis: { title: 'New analysis', description: 'Compare a client request with the agreement before you say yes.' },
  history: { title: 'History', description: 'Reopen earlier analyses and edit their suggested replies.' },
  settings: { title: 'Settings', description: 'Appearance and information about your local data.' },
  more: { title: 'More', description: 'Settings and workspace information.' },
}

/** Settings is reached through the "More" tab on mobile, so that tab stays highlighted. */
export function tabFor(view: View): View {
  return view === 'settings' ? 'more' : view
}
