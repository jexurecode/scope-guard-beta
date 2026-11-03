import { useId } from 'react'
import { SPARK_HEIGHT, SPARK_WIDTH, buildSparkline } from '../lib/sparkline'

type Props = {
  /** Daily counts, oldest first. Pass null when no history is tracked for this metric. */
  values: readonly number[] | null
  label: string
}

/**
 * Colour comes from the --tone custom property set by the parent card (.tone-*),
 * so one component serves every metric and both themes.
 */
export function Sparkline({ values, label }: Props) {
  const gradientId = `spark-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  const spark = values ? buildSparkline(values) : null
  const live = !!spark && spark.hasActivity
  const description = !values || !spark
    ? `${label}: no history is tracked for this metric`
    : live
      ? `${label} over the past seven days, oldest first: ${values.join(', ')}`
      : `${label}: no activity in the past seven days`

  return (
    <div role="img" aria-label={description} className="spark relative h-11 w-full">
      <div className={live ? 'spark-reveal absolute inset-0' : 'absolute inset-0'}>
        <svg viewBox={`0 0 ${SPARK_WIDTH} ${SPARK_HEIGHT}`} preserveAspectRatio="none" aria-hidden="true" className="absolute inset-0 size-full overflow-visible">
          {live && (
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" style={{ stopColor: 'var(--tone)', stopOpacity: 0.26 }} />
                <stop offset="1" style={{ stopColor: 'var(--tone)', stopOpacity: 0 }} />
              </linearGradient>
            </defs>
          )}
          <line x1="0" x2={SPARK_WIDTH} y1={SPARK_HEIGHT - 0.5} y2={SPARK_HEIGHT - 0.5} stroke="var(--line)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          {spark && live && <path d={spark.area} fill={`url(#${gradientId})`} />}
          {spark && live && <path d={spark.line} fill="none" stroke="var(--tone)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />}
          {spark && !live && <path d={spark.line} fill="none" stroke="var(--muted)" strokeOpacity="0.45" strokeWidth="1.5" strokeLinecap="round" vectorEffect="non-scaling-stroke" />}
          {!spark && <line x1={4} x2={SPARK_WIDTH - 4} y1={SPARK_HEIGHT - 12} y2={SPARK_HEIGHT - 12} stroke="var(--muted)" strokeOpacity="0.4" strokeWidth="1.5" strokeDasharray="3 5" strokeLinecap="round" vectorEffect="non-scaling-stroke" />}
        </svg>
        {spark && live && <span className="spark-dot" style={{ left: `${spark.last.x}%`, top: `${spark.last.y}%` }} />}
      </div>
    </div>
  )
}
