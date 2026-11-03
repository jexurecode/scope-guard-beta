import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

type Props = { icon: LucideIcon; title: string; children?: ReactNode; action?: ReactNode }

export function EmptyState({ icon: Icon, title, children, action }: Props) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-line bg-surface-2 px-6 py-8 text-center">
      <span className="icon-tile mb-3"><Icon size={20} aria-hidden="true" /></span>
      <p className="font-semibold text-fg">{title}</p>
      {children && <p className="mt-1 max-w-sm text-sm text-muted">{children}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
