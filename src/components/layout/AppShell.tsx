import { NavLink, Outlet } from 'react-router-dom'

export function AppShell() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-[var(--color-card)] shadow-[0_24px_80px_rgba(74,43,25,0.12)] lg:max-w-6xl">
      <header className="border-b border-[var(--color-line)] bg-[var(--color-surface)] px-5 pb-4 pt-6">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-brand-deep)]">
          Fitness PWA
        </p>
        <div className="mt-3 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-[var(--color-ink)]">健身动作记录</h1>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              先看统计，再从加号里选择动作并录入训练。
            </p>
          </div>
          <div className="rounded-full bg-[var(--color-brand)] px-3 py-1 text-xs font-semibold text-white">
            MVP
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 pb-28 pt-4 md:px-5 lg:px-6">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 mx-auto grid w-full max-w-md grid-cols-3 items-end border-t border-[var(--color-line)] bg-[rgba(255,250,241,0.96)] px-5 pb-3 pt-2 backdrop-blur lg:max-w-6xl">
        <BottomNavLink to="/stats" label="统计" ariaLabel="统计">
          <StatsIcon />
        </BottomNavLink>

        <BottomNavLink to="/workouts/new" label="新增训练" ariaLabel="新增训练" highlight>
          <PlusIcon />
        </BottomNavLink>

        <BottomNavLink to="/settings" label="设置" ariaLabel="设置">
          <SettingsIcon />
        </BottomNavLink>
      </nav>
    </div>
  )
}

function BottomNavLink(props: {
  to: string
  label: string
  ariaLabel: string
  children: React.ReactNode
  highlight?: boolean
}) {
  return (
    <NavLink
      to={props.to}
      aria-label={props.ariaLabel}
      className={({ isActive }) =>
        [
          'flex flex-col items-center gap-1 rounded-3xl px-2 py-1 text-center transition',
          props.highlight ? '' : isActive ? 'text-[var(--color-brand-deep)]' : 'text-[var(--color-muted)]',
        ].join(' ')
      }
    >
      <span
        className={[
          'flex items-center justify-center rounded-full',
          props.highlight
            ? 'h-14 w-14 bg-[var(--color-brand)] text-white shadow-[0_14px_30px_rgba(216,105,61,0.28)]'
            : 'h-11 w-11 border border-[var(--color-line)] bg-white',
        ].join(' ')}
      >
        {props.children}
      </span>
      <span className="text-xs font-medium">{props.label}</span>
    </NavLink>
  )
}

function StatsIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 19V9" strokeLinecap="round" />
      <path d="M10 19V5" strokeLinecap="round" />
      <path d="M16 19v-7" strokeLinecap="round" />
      <path d="M22 19v-11" strokeLinecap="round" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path
        d="M12 8.75a3.25 3.25 0 1 0 0 6.5a3.25 3.25 0 0 0 0-6.5Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M19.4 13.5a1.1 1.1 0 0 0 .22 1.21l.04.04a1.35 1.35 0 0 1 0 1.92l-1.33 1.33a1.35 1.35 0 0 1-1.92 0l-.04-.04a1.1 1.1 0 0 0-1.21-.22a1.1 1.1 0 0 0-.67 1.01V19a1.35 1.35 0 0 1-1.35 1.35h-1.88A1.35 1.35 0 0 1 9.91 19v-.06a1.1 1.1 0 0 0-.67-1.01a1.1 1.1 0 0 0-1.21.22l-.04.04a1.35 1.35 0 0 1-1.92 0L4.74 16.9a1.35 1.35 0 0 1 0-1.92l.04-.04a1.1 1.1 0 0 0 .22-1.21a1.1 1.1 0 0 0-1.01-.67H3.9A1.35 1.35 0 0 1 2.55 11.7V9.82A1.35 1.35 0 0 1 3.9 8.47h.06a1.1 1.1 0 0 0 1.01-.67a1.1 1.1 0 0 0-.22-1.21L4.7 6.55a1.35 1.35 0 0 1 0-1.92L6.03 3.3a1.35 1.35 0 0 1 1.92 0l.04.04a1.1 1.1 0 0 0 1.21.22a1.1 1.1 0 0 0 .67-1.01V2.5A1.35 1.35 0 0 1 11.22 1.15h1.88A1.35 1.35 0 0 1 14.45 2.5v.06a1.1 1.1 0 0 0 .67 1.01a1.1 1.1 0 0 0 1.21-.22l.04-.04a1.35 1.35 0 0 1 1.92 0l1.33 1.33a1.35 1.35 0 0 1 0 1.92l-.04.04a1.1 1.1 0 0 0-.22 1.21a1.1 1.1 0 0 0 1.01.67h.06a1.35 1.35 0 0 1 1.35 1.35v1.88a1.35 1.35 0 0 1-1.35 1.35h-.06a1.1 1.1 0 0 0-1.01.67Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
