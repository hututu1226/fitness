import dayjs from 'dayjs'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Exercise, WorkoutEntry } from '../db/schema'
import { getBodyPartLabel } from '../features/exercises/options'
import { listExercises } from '../features/exercises/service'
import { listWorkoutEntries } from '../features/workouts/service'
import {
  formatWorkoutDateWithWeekday,
  groupWorkoutEntriesByDate,
  joinWorkoutEntriesWithExercises,
} from '../features/workouts/selectors'

export function HistoryPage() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [entries, setEntries] = useState<WorkoutEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isActive = true

    void (async () => {
      try {
        const [nextExercises, nextEntries] = await Promise.all([listExercises(), listWorkoutEntries()])

        if (!isActive) {
          return
        }

        setExercises(nextExercises)
        setEntries(nextEntries)
      } catch {
        if (isActive) {
          setError('历史记录加载失败，请稍后重试。')
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

  const groupedEntries = useMemo(() => {
    const joinedEntries = joinWorkoutEntriesWithExercises(entries, exercises)
    return groupWorkoutEntriesByDate(joinedEntries)
  }, [entries, exercises])

  return (
    <section className="space-y-4">
      <header className="rounded-[2rem] bg-[linear-gradient(180deg,#f7efe3_0%,#efdfca_100%)] p-5 shadow-[0_20px_40px_rgba(143,59,30,0.08)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-brand-deep)]">
              History
            </p>
            <h2 className="mt-2 text-xl font-bold text-[var(--color-ink)]">按日期查看训练历史</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
              你在“新增训练”里保存的每一条记录，都会自动出现在这里。
            </p>
          </div>

          <Link
            to="/history/exercise"
            className="rounded-full border border-[var(--color-line)] bg-white px-4 py-2 text-sm font-medium text-[var(--color-ink)]"
          >
            按动作查看
          </Link>
        </div>
      </header>

      {error ? (
        <p className="rounded-2xl bg-[rgba(143,59,30,0.12)] px-4 py-3 text-sm text-[var(--color-brand-deep)]">
          {error}
        </p>
      ) : null}

      {isLoading ? (
        <section className="rounded-3xl border border-dashed border-[var(--color-line)] bg-white p-5">
          <p className="text-sm text-[var(--color-muted)]">正在读取训练历史...</p>
        </section>
      ) : null}

      {!isLoading && groupedEntries.length === 0 ? (
        <section className="rounded-3xl border border-dashed border-[var(--color-line)] bg-white p-5">
          <h3 className="text-base font-semibold text-[var(--color-ink)]">还没有历史记录</h3>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            先去底部点“新增训练”，录入一条动作、组数和重量，这里就会出现第一天的训练历史。
          </p>
        </section>
      ) : null}

      {!isLoading && groupedEntries.length > 0 ? (
        <div className="space-y-4">
          {groupedEntries.map((group) => (
            <section
              key={group.date}
              className="rounded-[1.7rem] border border-[var(--color-line)] bg-white p-5 shadow-[0_12px_28px_rgba(24,33,38,0.06)]"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-[var(--color-ink)]">
                    {formatWorkoutDateWithWeekday(group.date)}
                  </h3>
                  <p className="mt-1 text-sm text-[var(--color-muted)]">共 {group.entries.length} 条训练记录</p>
                </div>
                <span className="rounded-full bg-[rgba(216,105,61,0.12)] px-3 py-1 text-xs font-medium text-[var(--color-brand-deep)]">
                  {dayjs(group.date).format('MM/DD')}
                </span>
              </div>

              <div className="mt-4 space-y-3">
                {group.entries.map((entry) => (
                  <article
                    key={entry.id}
                    className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-card)] p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h4 className="text-base font-semibold text-[var(--color-ink)]">
                          {entry.exercise?.name ?? '未知动作'}
                        </h4>
                        <p className="mt-1 text-sm text-[var(--color-muted)]">
                          {entry.exercise ? getBodyPartLabel(entry.exercise.bodyPart) : '动作已从库中删除'}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {entry.sets !== null ? <MetricChip label="组数" value={String(entry.sets)} /> : null}
                        {entry.weight !== null ? <MetricChip label="重量" value={`${entry.weight} kg`} /> : null}
                        {entry.reps !== null ? <MetricChip label="次数" value={String(entry.reps)} /> : null}
                        {entry.durationSec !== null ? <MetricChip label="时长" value={`${entry.durationSec} 秒`} /> : null}
                      </div>
                    </div>

                    {entry.notes ? (
                      <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">{entry.notes}</p>
                    ) : null}
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : null}
    </section>
  )
}

function MetricChip(props: { label: string; value: string }) {
  return (
    <span className="rounded-full bg-white px-3 py-2 text-sm text-[var(--color-ink)] ring-1 ring-[var(--color-line)]">
      <span className="font-semibold">{props.label}</span>
      <span className="ml-2 text-[var(--color-muted)]">{props.value}</span>
    </span>
  )
}
