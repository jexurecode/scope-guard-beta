/** Pure helpers for the dashboard sparklines. No randomness: every point comes from saved data. */

export const SPARK_WIDTH = 200
export const SPARK_HEIGHT = 44
const PAD_X = 4
const PAD_TOP = 7
const PAD_BOTTOM = 5

export type Sparkline = {
  line: string
  area: string
  /** Position of the most recent point, as percentages of the chart box. */
  last: { x: number; y: number }
  /** False when every value is zero: the chart is a flat baseline, not a trend. */
  hasActivity: boolean
}

/** Number of dates that fall on each of the last `days` calendar days, oldest first. */
export function dailyCounts(dates: readonly string[], days = 7, now: number = Date.now()): number[] {
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)
  start.setDate(start.getDate() - (days - 1))
  const counts = Array.from({ length: days }, () => 0)
  for (const iso of dates) {
    const time = Date.parse(iso)
    if (!Number.isFinite(time)) continue
    for (let i = 0; i < days; i++) {
      const from = new Date(start)
      from.setDate(from.getDate() + i)
      const to = new Date(from)
      to.setDate(to.getDate() + 1)
      if (time >= from.getTime() && time < to.getTime()) { counts[i] = (counts[i] ?? 0) + 1; break }
    }
  }
  return counts
}

const fmt = (n: number) => (Math.round(n * 100) / 100).toString()

/**
 * Builds a smooth path through the values using monotone cubic interpolation
 * (Fritsch-Carlson). Unlike Catmull-Rom it never overshoots between points, so a
 * curve can't dip below the baseline or above the peak. Returns null for < 2 values.
 */
export function buildSparkline(values: readonly number[]): Sparkline | null {
  const n = values.length
  if (n < 2) return null
  const max = Math.max(...values)
  const hasActivity = max > 0
  const innerH = SPARK_HEIGHT - PAD_TOP - PAD_BOTTOM
  const xs = values.map((_, i) => PAD_X + (i * (SPARK_WIDTH - 2 * PAD_X)) / (n - 1))
  const ys = values.map(v => (hasActivity ? PAD_TOP + (1 - Math.max(0, v) / max) * innerH : PAD_TOP + innerH))

  // Secant slopes and Fritsch-Carlson tangents.
  const dx = xs.slice(1).map((x, i) => x - (xs[i] ?? 0))
  const secants = dx.map((d, i) => ((ys[i + 1] ?? 0) - (ys[i] ?? 0)) / d)
  const tangents = values.map((_, i) => {
    if (i === 0) return secants[0] ?? 0
    if (i === n - 1) return secants[n - 2] ?? 0
    const a = secants[i - 1] ?? 0
    const b = secants[i] ?? 0
    return a * b <= 0 ? 0 : (a + b) / 2
  })
  for (let i = 0; i < n - 1; i++) {
    const s = secants[i] ?? 0
    if (s === 0) { tangents[i] = 0; tangents[i + 1] = 0; continue }
    const a = (tangents[i] ?? 0) / s
    const b = (tangents[i + 1] ?? 0) / s
    const h = Math.hypot(a, b)
    if (h > 3) { tangents[i] = (3 * a * s) / h; tangents[i + 1] = (3 * b * s) / h }
  }

  let line = `M${fmt(xs[0] ?? 0)} ${fmt(ys[0] ?? 0)}`
  for (let i = 0; i < n - 1; i++) {
    const x0 = xs[i] ?? 0, y0 = ys[i] ?? 0, x1 = xs[i + 1] ?? 0, y1 = ys[i + 1] ?? 0
    const d = (x1 - x0) / 3
    line += ` C${fmt(x0 + d)} ${fmt(y0 + (tangents[i] ?? 0) * d)} ${fmt(x1 - d)} ${fmt(y1 - (tangents[i + 1] ?? 0) * d)} ${fmt(x1)} ${fmt(y1)}`
  }
  const area = `${line} L${fmt(xs[n - 1] ?? 0)} ${SPARK_HEIGHT} L${fmt(xs[0] ?? 0)} ${SPARK_HEIGHT} Z`
  return {
    line,
    area,
    last: { x: ((xs[n - 1] ?? 0) / SPARK_WIDTH) * 100, y: ((ys[n - 1] ?? 0) / SPARK_HEIGHT) * 100 },
    hasActivity,
  }
}
