import dayjs from 'dayjs'
import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import {
  clearAppData,
  exportAppData,
  getAppDataSummary,
  importAppData,
  type AppDataExport,
} from '../features/settings/service'
import {
  getAppPreferences,
  getWeekStartsOnLabel,
  getWeightUnitLabel,
  saveAppPreferences,
  type AppPreferences,
} from '../features/settings/preferences'

type Summary = {
  exerciseCount: number
  workoutEntryCount: number
  trainedDayCount: number
  exportVersion: number
  lastUpdatedAt: string | null
}

export function SettingsPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [summary, setSummary] = useState<Summary | null>(null)
  const [preferences, setPreferences] = useState<AppPreferences>(getAppPreferences())
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
          setPreferences(getAppPreferences())
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

  function handlePreferenceChange(nextPreferences: Partial<AppPreferences>) {
    const saved = saveAppPreferences(nextPreferences)
    setPreferences(saved)
    setMessage('偏好设置已更新。')
    setError(null)
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
          <>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <SummaryCard label="动作数量" value={String(summary?.exerciseCount ?? 0)} />
              <SummaryCard label="记录条数" value={String(summary?.workoutEntryCount ?? 0)} />
              <SummaryCard label="训练天数" value={String(summary?.trainedDayCount ?? 0)} />
              <SummaryCard label="数据版本" value={`v${summary?.exportVersion ?? 0}`} />
            </div>
            <p className="mt-4 text-sm text-[var(--color-muted)]">
              数据更新时间：
              {summary?.lastUpdatedAt ? dayjs(summary.lastUpdatedAt).format('YYYY年M月D日 HH:mm') : '暂无'}
            </p>
          </>
        )}
      </section>

      <section className="rounded-[1.7rem] border border-[var(--color-line)] bg-white p-5 shadow-[0_12px_28px_rgba(24,33,38,0.06)]">
        <h3 className="text-lg font-bold text-[var(--color-ink)]">使用偏好</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="重量单位">
            <select
              value={preferences.weightUnit}
              onChange={(event) =>
                handlePreferenceChange({ weightUnit: event.target.value as AppPreferences['weightUnit'] })
              }
              className="w-full rounded-2xl border border-[var(--color-line)] bg-[var(--color-card)] px-4 py-3 text-sm outline-none transition focus:border-[var(--color-brand)] focus:bg-white"
            >
              <option value="kg">{getWeightUnitLabel('kg')}</option>
              <option value="lb">{getWeightUnitLabel('lb')}</option>
            </select>
          </Field>

          <Field label="每周起始日">
            <select
              value={preferences.weekStartsOn}
              onChange={(event) =>
                handlePreferenceChange({ weekStartsOn: event.target.value as AppPreferences['weekStartsOn'] })
              }
              className="w-full rounded-2xl border border-[var(--color-line)] bg-[var(--color-card)] px-4 py-3 text-sm outline-none transition focus:border-[var(--color-brand)] focus:bg-white"
            >
              <option value="monday">{getWeekStartsOnLabel('monday')}</option>
              <option value="sunday">{getWeekStartsOnLabel('sunday')}</option>
            </select>
          </Field>
        </div>
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
    </section>
  )
}

function Field(props: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-[var(--color-ink)]">{props.label}</span>
      {props.children}
    </label>
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
