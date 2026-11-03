import { afterEach, describe, expect, it, vi } from 'vitest'
import { readTheme, saveTheme } from './theme-storage'

afterEach(() => vi.unstubAllGlobals())

describe('theme persistence', () => {
  it.each([null, '', 'light', 'invalid', 'DARK'])('defaults to light for %s', (stored) => {
    vi.stubGlobal('localStorage', { getItem: () => stored })
    expect(readTheme()).toBe('light')
  })

  it('restores an explicitly selected dark theme', () => {
    vi.stubGlobal('localStorage', { getItem: () => 'dark' })
    expect(readTheme()).toBe('dark')
  })

  it.each(['light', 'dark'] as const)('persists %s using the existing key', (theme) => {
    const setItem = vi.fn()
    vi.stubGlobal('localStorage', { setItem })
    saveTheme(theme)
    expect(setItem).toHaveBeenCalledWith('scope-guard-theme', theme)
  })

  it('falls back to light when reading storage fails', () => {
    vi.stubGlobal('localStorage', { getItem: () => { throw new Error('Blocked') } })
    expect(readTheme()).toBe('light')
  })

  it('does not crash when persistence fails', () => {
    vi.stubGlobal('localStorage', { setItem: () => { throw new Error('Full') } })
    expect(() => saveTheme('dark')).not.toThrow()
  })
})
