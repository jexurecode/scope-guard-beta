import { TAB_ITEMS, tabFor } from '../../lib/navigation'
import type { View } from '../../lib/navigation'

type Props = { view: View; onNavigate: (view: View) => void }

/** Mobile navigation: "Pill Highlight" style. Styles live in index.css (.bottom-nav). */
export function BottomNav({ view, onNavigate }: Props) {
  const current = tabFor(view)
  return (
    <nav aria-label="Mobile navigation" className="bottom-nav lg:hidden">
      <ul>
        {TAB_ITEMS.map(({ id, label, icon: Icon }) => {
          const active = id === current
          return (
            <li key={id}>
              <button type="button" onClick={() => onNavigate(id)} aria-current={active ? 'page' : undefined}>
                <Icon size={22} strokeWidth={active ? 2.4 : 1.9} aria-hidden="true" />
                {label}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
