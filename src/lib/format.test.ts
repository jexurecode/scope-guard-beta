import { describe, expect, it } from 'vitest'
import { formatBytes, isWithinDays, timeAgo } from './format'

const NOW = Date.parse('2026-01-15T12:00:00Z')
const ago = (ms: number) => new Date(NOW - ms).toISOString()

describe('timeAgo', () => {
  it('formats recent times', () => {
    expect(timeAgo(ago(10_000), NOW)).toBe('Just now')
    expect(timeAgo(ago(15 * 60_000), NOW)).toBe('15 min ago')
    expect(timeAgo(ago(3 * 3_600_000), NOW)).toBe('3 hr ago')
    expect(timeAgo(ago(86_400_000), NOW)).toBe('1 day ago')
    expect(timeAgo(ago(3 * 86_400_000), NOW)).toBe('3 days ago')
  })
  it('never reports negative time and tolerates invalid dates', () => {
    expect(timeAgo(ago(-60_000), NOW)).toBe('Just now')
    expect(timeAgo('not a date', NOW)).toBe('')
  })
})

describe('isWithinDays', () => {
  it('detects the last week', () => {
    expect(isWithinDays(ago(2 * 86_400_000), 7, NOW)).toBe(true)
    expect(isWithinDays(ago(9 * 86_400_000), 7, NOW)).toBe(false)
    expect(isWithinDays('bad', 7, NOW)).toBe(false)
  })
})

describe('formatBytes', () => {
  it('scales units', () => {
    expect(formatBytes(512)).toBe('512 B')
    expect(formatBytes(2048)).toBe('2.0 KB')
    expect(formatBytes(3 * 1024 * 1024)).toBe('3.0 MB')
  })
})
