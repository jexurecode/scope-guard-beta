import type { Theme } from '../types/theme'

const THEME_KEY = 'scope-guard-theme'

export function readTheme(): Theme {
  try {
    return localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

export function saveTheme(theme: Theme): void {
  try {
    localStorage.setItem(THEME_KEY, theme)
  } catch {
    // A blocked or full store must not prevent theme changes in this session.
  }
}
