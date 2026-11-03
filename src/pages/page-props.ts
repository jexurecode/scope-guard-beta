import type { ScopeState } from '../hooks/useScopeAnalysis'
import type { View } from '../lib/navigation'
import type { Theme } from '../types/theme'

export type PageProps = {
  scope: ScopeState
  navigate: (view: View) => void
  /** Reopen a saved analysis (switching to its project) and show it. */
  openAnalysis: (id: string) => void
}

export type ThemeProps = { theme: Theme; onThemeChange: (theme: Theme) => void }
