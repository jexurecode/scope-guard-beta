import { useId } from 'react'

/** Decorative, local SVG artwork; no account data or external image requests. */
export function WorkspaceIllustration() {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  return (
    <svg viewBox="0 0 400 210" fill="none" aria-hidden="true" focusable="false" className="workspace-illustration">
      <defs>
        <linearGradient id={`${id}-screen`} x1="144" y1="25" x2="330" y2="174" gradientUnits="userSpaceOnUse"><stop stopColor="#6034bc" /><stop offset="1" stopColor="#221648" /></linearGradient>
        <linearGradient id={`${id}-leaf`} x1="342" y1="85" x2="376" y2="163" gradientUnits="userSpaceOnUse"><stop stopColor="#9bd7a5" /><stop offset="1" stopColor="#4d9b78" /></linearGradient>
        <linearGradient id={`${id}-paper`} x1="79" y1="67" x2="156" y2="182" gradientUnits="userSpaceOnUse"><stop stopColor="#fff" /><stop offset="1" stopColor="#f0ecff" /></linearGradient>
      </defs>
      <ellipse cx="226" cy="192" rx="150" ry="8" fill="#4e2a94" opacity=".09" />
      <path d="M151 29a9 9 0 0 1 9-8h158a9 9 0 0 1 9 9l-6 148H144l7-149Z" fill="#21183f" />
      <path d="m159 31-6 136h159l6-136H159Z" fill={`url(#${id}-screen)`} />
      <path d="M127 178h210l-13 10H140l-13-10Z" fill="#b6aec8" /><path d="M127 178h210v4H127z" fill="#d9d3e5" /><path d="M211 178h45l-4 4h-37l-4-4Z" fill="#8e83aa" />
      <path d="m238 62 27 11v25c0 23-27 37-27 37s-27-14-27-37V73l27-11Z" stroke="#ede5ff" strokeWidth="5" strokeLinejoin="round" />
      <path d="m226 98 9 9 17-20" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="70" y="64" width="106" height="115" rx="10" fill="#2e1855" opacity=".08" />
      <rect x="66" y="59" width="106" height="115" rx="10" fill={`url(#${id}-paper)`} />
      <rect x="80" y="75" width="55" height="5" rx="2.5" fill="#9363dc" />
      {[94, 116, 138].map(y => <g key={y}><rect x="80" y={y} width="12" height="12" rx="4" fill="#85c69c" /><path d={`m83 ${y + 6} 2 2 4-4`} stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><rect x="100" y={y + 2} width="56" height="3.5" rx="1.75" fill="#c6c0d8" /><rect x="100" y={y + 8} width="39" height="3" rx="1.5" fill="#e0dbea" /></g>)}
      <path d="M357 157c-21-17-30-38-21-44 12-8 25 24 21 44Z" fill={`url(#${id}-leaf)`} /><path d="M358 158c-5-41 2-70 12-67 12 5-2 42-12 67Z" fill={`url(#${id}-leaf)`} /><path d="M359 159c5-31 21-48 28-41 7 9-14 31-28 41Z" fill={`url(#${id}-leaf)`} />
      <path d="m342 154 5 32h26l5-32h-36Z" fill="#e7e1f1" /><path d="m342 154 5 32h11v-32h-16Z" fill="#fff" opacity=".65" /><rect x="340" y="151" width="40" height="6" rx="3" fill="#f9f7fe" />
      <circle cx="114" cy="36" r="4" fill="#b497eb" opacity=".6" /><path d="M346 46v10m-5-5h10" stroke="#ac8de3" strokeWidth="2" strokeLinecap="round" opacity=".65" />
    </svg>
  )
}
