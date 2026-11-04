import { afterEach, describe, expect, it, vi } from 'vitest'
import { createSavedAnalysis, isWorkspace } from './workspace'

const randomValues = globalThis.crypto.getRandomValues.bind(globalThis.crypto)
afterEach(() => vi.unstubAllGlobals())

describe('LAN HTTP / older browser identifier regression', () => {
  it('saves analysis IDs when randomUUID is unavailable, as on insecure LAN origins', () => {
    vi.stubGlobal('crypto', { getRandomValues: randomValues })
    const saved = createSavedAnalysis('p', 'Build a landing page. Blog excluded.', 'Add a blog.')
    expect(saved.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
    expect(isWorkspace({ version: 1, projects: [{ id: 'p', name: 'LAN client', agreement: saved.agreement }], analyses: [saved] })).toBe(true)
  })
  it('creates distinct IDs without randomUUID', () => {
    vi.stubGlobal('crypto', { getRandomValues: randomValues })
    const ids = Array.from({ length: 128 }, () => createSavedAnalysis('p', 'Website.', 'Add booking.').id)
    expect(new Set(ids).size).toBe(ids.length)
  })
  it('preserves the native UUID path on HTTPS/localhost', () => {
    const id = '9fb60a4e-ef26-4c26-85b4-30f3966eaa2b'
    const getRandomValues = vi.fn()
    vi.stubGlobal('crypto', { randomUUID: () => id, getRandomValues })
    expect(createSavedAnalysis('p', 'Website.', 'Add booking.').id).toBe(id)
    expect(getRandomValues).not.toHaveBeenCalled()
  })
  it('reports unsupported randomness without weakening IDs to Math.random', () => {
    vi.stubGlobal('crypto', undefined)
    expect(() => createSavedAnalysis('p', 'Website.', 'Add booking.')).toThrow(/browser cannot generate local record IDs/i)
  })

})
