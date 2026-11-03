import { useRef, useState } from 'react'
import { AppHeader } from './components/layout/AppHeader'
import { BottomNav } from './components/layout/BottomNav'
import { Sidebar } from './components/layout/Sidebar'
import { StorageAlert } from './components/StorageAlert'
import { useNotificationReads } from './hooks/useNotificationReads'
import { useScopeAnalysis } from './hooks/useScopeAnalysis'
import { useTheme } from './hooks/useTheme'
import type { View } from './lib/navigation'
import { AnalysisPage } from './pages/AnalysisPage'
import { DashboardPage } from './pages/DashboardPage'
import { HistoryPage } from './pages/HistoryPage'
import { MorePage } from './pages/MorePage'
import { ProjectsPage } from './pages/ProjectsPage'
import { SettingsPage } from './pages/SettingsPage'

export default function App() {
  const { theme, setTheme, toggleTheme } = useTheme()
  const scope = useScopeAnalysis()
  const notifications = useNotificationReads(scope.data.analyses)
  const [view, setView] = useState<View>('dashboard')
  const mainRef = useRef<HTMLElement>(null)

  const navigate = (next: View) => {
    setView(next)
    window.scrollTo?.({ top: 0, behavior: 'instant' })
    // Move focus to the new page so keyboard and screen-reader users land in the content.
    setTimeout(() => mainRef.current?.focus({ preventScroll: true }), 0)
  }
  const openAnalysis = (id: string) => { scope.reopen(id); navigate('analysis') }
  const page = { scope, navigate, openAnalysis }

  return (
    <div className="min-h-dvh bg-canvas text-fg">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-brand-600 focus:px-4 focus:py-2 focus:text-white">Skip to main content</a>
      <div className="lg:flex lg:min-h-dvh">
        <Sidebar view={view} onNavigate={navigate} />
        <div className="min-w-0 flex-1">
          <AppHeader view={view} theme={theme} onToggleTheme={toggleTheme} onNavigate={navigate} data={scope.data} notifications={notifications} onOpenAnalysis={openAnalysis} onSelectProject={scope.selectProject} />
          <main id="main" ref={mainRef} tabIndex={-1} className="mx-auto max-w-[1200px] px-4 pb-[calc(6.5rem+env(safe-area-inset-bottom))] pt-5 outline-none sm:px-8 lg:pb-10 lg:pt-7">
            {scope.storageError && <StorageAlert message={scope.storageError} blocked={scope.storageBlocked} onRetry={scope.retrySave} />}
            {view === 'dashboard' && <DashboardPage {...page} />}
            {view === 'projects' && <ProjectsPage {...page} />}
            {view === 'analysis' && <AnalysisPage {...page} />}
            {view === 'history' && <HistoryPage {...page} />}
            {view === 'settings' && <SettingsPage scope={scope} theme={theme} onThemeChange={setTheme} />}
            {view === 'more' && <MorePage theme={theme} onToggleTheme={toggleTheme} navigate={navigate} />}
            <footer className="mt-10 border-t border-line pt-5 text-center text-xs text-muted">Scope Guard · Free local prototype</footer>
          </main>
        </div>
      </div>
      <BottomNav view={view} onNavigate={navigate} />
    </div>
  )
}
