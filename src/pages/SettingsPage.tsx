import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import {
  clearAppData,
  exportAppData,
  getAppDataSummary,
  importAppData,
  type AppDataExport,
} from '../features/settings/service'

type Summary = {
  exerciseCount: number
  workoutEntryCount: number
  trainedDayCount: number
  exportVersion: number
}

export function SettingsPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [summary, setSummary] = useState<Summary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [isClearing, setIsClearing] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function refreshSummary() {
    const nextSummary = await getAppDataSummary()
    setSummary(nextSummary)
  }

  useEffect(() => {
    let isActive = true

    void (async () => {
      try {
        const nextSummary = await getAppDataSummary()

        if (isActive) {
          setSummary(nextSummary)
        }
      } catch {
        if (isActive) {
          setError('设置页加载失败，请稍后重试。')
        }
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    })()

    return () => {
      isActive = false
    }
  }, [])

  async function handleExport() {
    setIsExporting(true)
    setMessage(null)
    setError(null)

    try {
      const data = await exportAppData()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `fitness-pwa-backup-${new Date().toISOString().slice(0, 10)}.json`
      anchor.click()
      URL.revokeObjectURL(url)
      setMessage('本地数据已经导出。')
    } catch {
      setError('导出失败，请稍后重试。')
    } finally {
      setIsExporting(false)
    }
  }

  async function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    setIsImporting(true)
    setMessage(null)
    setError(null)

    try {
      const raw = await file.text()
      const payload = JSON.parse(raw) as AppDataExport
      await importAppData(payload)
      await refreshSummary()
      setMessage('数据已经导入完成。')
    } catch {
      setError('导入失败，请确认你选择的是本应用导出的 JSON 文件。')
    } finally {
      event.target.value = ''
      setIsImporting(false)
    }
  }

  async function handleClear() {
    const confirmed = window.confirm('确定清空本地动作库和训练记录吗？这个操作不能撤销。')

    if (!confirmed) {
      return
    }

    setIsClearing(true)
    setMessage(null)
    setError(null)

    try {
      await clearAppData()
      await refreshSummary()
      setMessage('本地数据已经清空。')
    } catch {
      setError('清空失败，请稍后重试。')
    } finally {
      setIsClearing(false)
    }
  }

  return (
    <section className="space-y-4">
      <header className="rounded-[2rem] bg-[linear-gradient(180deg,#f7efe3_0%,#efdfca_100%)] p-5 text-center shadow-[0_20px_40px_rgba(143,59,30,0.08)]">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-brand-deep)]">Settings</p>
        <h2 className="mt-2 text-2xl font-bold text-[var(--color-ink)]">设置</h2>
      </header>

      {message ? (
        <p className="rounded-2xl bg-[rgba(46,103,181,0.12)] px-4 py-3 text-sm text-[rgb(46,103,181)]">{message}</p>
      ) : null}

      {error ? (
        <p className="rounded-2xl bg-[rgba(143,59,30,0.12)] px-4 py-3 text-sm text-[var(--color-brand-deep)]">{error}</p>
      ) : null}

      <section className="rounded-[1.7rem] border border-[var(--color-line)] bg-white p-5 shadow-[0_12px_28px_rgba(24,33,38,0.06)]">
        <h3 className="text-lg font-bold text-[var(--color-ink)]">本地数据概览</h3>

        {isLoading ? (
          <p className="mt-4 text-sm text-[var(--color-muted)]">正在读取本地数据...</p>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3">
            <SummaryCard label="动作数量" value={String(summary?.exerciseCount ?? 0)} />
            <SummaryCard label="记录条数" value={String(summary?.workoutEntryCount ?? 0)} />
            <SummaryCard label="训练天数" value={String(summary?.trainedDayCount ?? 0)} />
            <SummaryCard label="数据版本" value={`v${summary?.exportVersion ?? 0}`} />
          </div>
        )}
      </section>

      <section className="rounded-[1.7rem] border border-[var(--color-line)] bg-white p-5 shadow-[0_12px_28px_rgba(24,33,38,0.06)]">
        <h3 className="text-lg font-bold text-[var(--color-ink)]">数据管理</h3>

        <div className="mt-4 grid gap-3">
          <button
            type="button"
            onClick={() => void handleExport()}
            disabled={isExporting}
            className="w-full rounded-2xl bg-[var(--color-brand)] px-4 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isExporting ? '导出中...' : '导出本地数据'}
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="w-full rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3 text-sm font-semibold text-[var(--color-ink)] transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isImporting ? '导入中...' : '导入备份文件'}
          </button>

          <button
            type="button"
            onClick={() => void handleClear()}
            disabled={isClearing}
            className="w-full rounded-2xl bg-[rgba(143,59,30,0.12)] px-4 py-3 text-sm font-semibold text-[var(--color-brand-deep)] transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isClearing ? '清空中...' : '清空本地数据'}
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(event) => void handleImport(event)}
        />
      </section>

      <section className="rounded-[1.7rem] border border-[var(--color-line)] bg-white p-5 shadow-[0_12px_28px_rgba(24,33,38,0.06)]">
        <h3 className="text-lg font-bold text-[var(--color-ink)]">关于本应用</h3>
        <div className="mt-3 space-y-2 text-sm leading-6 text-[var(--color-muted)]">
          <p>这是一个移动端优先的本地训练记录 App，数据默认保存在浏览器的 IndexedDB。</p>
          <p>动作 GIF 跟随应用一起打包，离线时也能继续查看。</p>
        </div>
      </section>
    </section>
  )
}

function SummaryCard(props: { label: string; value: string }) {
  return (
    <article className="rounded-2xl bg-[var(--color-card)] px-4 py-4 text-center">
      <p className="text-xs text-[var(--color-muted)]">{props.label}</p>
      <p className="mt-2 text-base font-semibold text-[var(--color-ink)]">{props.value}</p>
    </article>
  )
}
