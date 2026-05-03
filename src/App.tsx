import { useEffect, useState } from 'react'
import { RouterProvider } from 'react-router-dom'
import { AppProviders } from './app/providers'
import { router } from './app/router'
import { ensureStarterExercises } from './features/exercises/service'

function App() {
  const [isBooting, setIsBooting] = useState(true)

  useEffect(() => {
    let isActive = true

    void Promise.all([
      ensureStarterExercises().catch(() => null),
      new Promise((resolve) => window.setTimeout(resolve, 1400)),
    ]).finally(() => {
      if (isActive) {
        setIsBooting(false)
      }
    })

    return () => {
      isActive = false
    }
  }, [])

  return (
    <AppProviders>
      {isBooting ? <SplashScreen /> : <RouterProvider router={router} />}
    </AppProviders>
  )
}

function SplashScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#fff7ec_0%,#f6efe3_45%,#ecd8bf_100%)] px-6">
      <div className="w-full max-w-sm rounded-[2.5rem] border border-white/70 bg-white/70 p-8 text-center shadow-[0_24px_80px_rgba(74,43,25,0.16)] backdrop-blur">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[2rem] bg-[linear-gradient(160deg,#d8693d_0%,#8f3b1e_100%)] text-white shadow-[0_18px_40px_rgba(143,59,30,0.3)]">
          <SplashMark />
        </div>
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.28em] text-[var(--color-brand-deep)]">
          Fitness PWA
        </p>
        <h1 className="mt-3 text-3xl font-black text-[var(--color-ink)]">健身动作记录</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">每天进步一小步。</p>
        <div className="mx-auto mt-6 h-2.5 w-40 overflow-hidden rounded-full bg-[rgba(143,59,30,0.10)]">
          <div className="h-full w-full origin-left animate-[splash-load_1.4s_ease-in-out] rounded-full bg-[linear-gradient(90deg,#d8693d_0%,#5d9cec_100%)]" />
        </div>
      </div>
    </div>
  )
}

function SplashMark() {
  return (
    <svg viewBox="0 0 80 80" className="h-12 w-12" fill="none" stroke="currentColor" strokeWidth="5">
      <path d="M22 18h30" strokeLinecap="round" />
      <path d="M22 18v44" strokeLinecap="round" />
      <path d="M22 40h24" strokeLinecap="round" />
      <path d="M56 26h10" strokeLinecap="round" />
      <path d="M56 54h10" strokeLinecap="round" />
      <path d="M14 23h8v-10" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 57h8v10" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M66 23h-8v-10" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M66 57h-8v10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default App
