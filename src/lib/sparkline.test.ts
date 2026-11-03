import { describe, expect, it } from 'vitest'
import { SPARK_HEIGHT, buildSparkline, dailyCounts } from './sparkline'

describe('dailyCounts', () => {
  const now = new Date(2026, 0, 15, 12).getTime()
  it('buckets dates into the last seven calendar days, oldest first', () => {
    const dates = [
      new Date(2026, 0, 15, 9).toISOString(),
      new Date(2026, 0, 14, 23, 59).toISOString(),
      new Date(2026, 0, 14, 1).toISOString(),
      new Date(2026, 0, 9, 0, 0).toISOString(),
      new Date(2026, 0, 8, 23, 0).toISOString(), // eight days back: outside the window
    ]
    expect(dailyCounts(dates, 7, now)).toEqual([1, 0, 0, 0, 0, 2, 1])
  })
  it('ignores invalid dates and returns zeros for no data', () => {
    expect(dailyCounts(['nope'], 7, now)).toEqual([0, 0, 0, 0, 0, 0, 0])
    expect(dailyCounts([], 7, now)).toHaveLength(7)
  })
})

describe('buildSparkline', () => {
  const ys = (path: string) => (path.match(/-?\d+(\.\d+)?/g) ?? []).map(Number).filter((_, i) => i % 2 === 1 || false)

  it('needs at least two points', () => {
    expect(buildSparkline([])).toBeNull()
    expect(buildSparkline([3])).toBeNull()
  })
  it('is deterministic for the same data', () => {
    expect(buildSparkline([0, 1, 3, 2, 0, 0, 4])).toEqual(buildSparkline([0, 1, 3, 2, 0, 0, 4]))
  })
  it('draws a smooth cubic curve with a closed gradient area', () => {
    const spark = buildSparkline([0, 1, 3, 2, 0, 0, 4])
    expect(spark?.line.startsWith('M')).toBe(true)
    expect(spark?.line.match(/C/g)).toHaveLength(6)
    expect(spark?.area.endsWith('Z')).toBe(true)
    expect(spark?.hasActivity).toBe(true)
  })
  it('never overshoots the data range between points', () => {
    const spark = buildSparkline([0, 0, 5, 0, 0, 0, 0])
    const values = ys(spark?.line ?? '')
    expect(Math.min(...values)).toBeGreaterThanOrEqual(6.99) // top padding: the peak
    expect(Math.max(...values)).toBeLessThanOrEqual(39.01) // bottom padding: the zero baseline
  })
  it('reports a flat baseline when there is no activity', () => {
    const spark = buildSparkline([0, 0, 0, 0, 0, 0, 0])
    expect(spark?.hasActivity).toBe(false)
    expect(new Set(ys(spark?.line ?? '')).size).toBe(1)
  })
  it('places the last point at the right edge, scaled to the latest value', () => {
    const peak = buildSparkline([1, 2, 3])
    const low = buildSparkline([3, 2, 0])
    expect(peak?.last.y ?? 100).toBeLessThan(low?.last.y ?? 0)
    expect(peak?.last.x).toBeGreaterThan(90)
    expect(low?.last.y ?? 0).toBeLessThanOrEqual(100)
    expect(SPARK_HEIGHT).toBe(44)
  })
})
