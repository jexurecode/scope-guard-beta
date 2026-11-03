import { useEffect, useState } from 'react'
import { readTheme, saveTheme } from '../lib/theme-storage'

export function useTheme() {
  const [theme, setTheme] = useState(readTheme)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    saveTheme(theme)
  }, [theme])

  function toggleTheme() {
    setTheme((current) => current === 'light' ? 'dark' : 'light')
  }

  return { theme, setTheme, toggleTheme }
}
