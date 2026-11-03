import { Moon, Sun } from 'lucide-react'
import type { Theme } from '../../types/theme'

type Props = { theme: Theme; onToggle: () => void }

export function ThemeToggle({ theme, onToggle }: Props) {
  const label = theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'
  return <button type="button" onClick={onToggle} aria-label={label} title={label} className="icon-btn">{theme === 'light' ? <Moon size={19} aria-hidden="true" /> : <Sun size={19} aria-hidden="true" />}</button>
}
