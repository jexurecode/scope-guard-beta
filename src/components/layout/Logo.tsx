import { ShieldCheck } from 'lucide-react'

type Props = { tagline?: boolean }

export function Logo({ tagline = false }: Props) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white"><ShieldCheck size={24} aria-hidden="true" /></span>
      <div className="min-w-0">
        <p className="text-lg font-bold leading-tight tracking-tight">Scope Guard</p>
        {tagline && <p className="text-xs leading-4 text-brand-200">Protect your work. Know your scope.</p>}
      </div>
    </div>
  )
}
