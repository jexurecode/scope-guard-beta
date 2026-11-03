import type { Analysis } from '../types/analysis'
import { STATUS_LABEL } from '../lib/format'

const TONE: Record<Analysis['status'], string> = {
  'potential-change': 'border-warn-line bg-warn-bg text-warn-fg',
  'needs-review': 'border-info-line bg-info-bg text-info-fg',
}

type Props = { status: Analysis['status']; className?: string }

export function StatusBadge({ status, className = '' }: Props) {
  return <span className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold ${TONE[status]} ${className}`}>{STATUS_LABEL[status]}</span>
}
