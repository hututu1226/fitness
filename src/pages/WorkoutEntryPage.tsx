import dayjs from 'dayjs'
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import type { Exercise, WorkoutEntry } from '../db/schema'
import { getBodyPartLabel } from '../features/exercises/options'
import { getExerciseById } from '../features/exercises/service'
import { WorkoutEntryForm } from '../features/workouts/components/WorkoutEntryForm'
import type { WorkoutEntryFormValues } from '../features/workouts/schema'
import { createWorkoutEntry, listWorkoutEntriesByDate } from '../features/workouts/service'
import { joinWorkoutEntriesWithExercises } from '../features/workouts/selectors'

export function WorkoutEntryPage() {
  const { exerciseId } = useParams()
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'))
  const [exercise, setExercise] = useState<Exercise | null>(null)
  const [entries, setEntries] = useState<WorkoutEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isActive = true

    void (async () => {
      if (!exerciseId) {
        if (isActive) {
          setError('没有接收到动作信息，请先回到上一步选择动作。')
          setIsLoading(false)
        }
        return
      }

      try {
        const [nextExercise, nextEntries] = await Promise.all([
          getExerciseById(exerciseId),
          listWorkoutEntriesByDate(selectedDate),
        ])

        if (!isActive) {
          return
        }

        if (!nextExercise || nextExercise.isDeleted) {
          setError('这个动作不存在了，请重新选择。')
          setExercise(null)
          return
        }

        setExercise(nextExercise)
        setEntries(nextEntries)
      } catch {
        if (isActive) {
          setError('训练记录页面加载失败，请稍后重试。')
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
  }, [exerciseId, selectedDate])

  const entryCards = useMemo(
    () => (exercise ? joinWorkoutEntriesWithExercises(entries, [exercise]) : []),
    [entries, exercise],
  )

  async function refreshEntries(date: string) {
    const nextEntries = await listWorkoutEntriesByDate(date)
    setEntries(nextEntries)
  }

  async function handleSubmit(values: WorkoutEntryFormValues) {
    setIsSubmitting(true)
    setError(null)

    try {
      await createWorkoutEntry(values)
      await refreshEntries(values.date)
      setSelectedDate(values.date)
    } catch {
      setError('保存训练记录失败，请稍后重试。')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <section className="rounded-3xl border border-dashed border-[var(--color-line)] bg-white p-5">
        <p className="text-sm text-[var(--color-muted)]">正在读取动作和当天记录...</p>
      </section>
    )
  }

  if (!exercise) {
    return (
      <section className="space-y-4">
        <section className="rounded-[1.7rem] border border-[var(--color-line)] bg-white p-5 shadow-[0_12px_28px_rgba(24,33,38,0.06)]">
          <h2 className="text-xl font-bold text-[var(--color-ink)]">无法进入训练记录</h2>
          <p className="mt-2 text-sm text-[var(--color-muted)]">{error ?? '请先选择一个动作。'}</p>
          <Link
            to="/workouts/new"
            className="mt-4 inline-flex rounded-full bg-[var(--color-brand)] px-4 py-2 text-sm font-semibold text-white"
          >
            返回动作选择
          </Link>
        </section>
      </section>
    )
  }

  return (
    <section className="space-y-4">
      <header className="rounded-[2rem] bg-[linear-gradient(180deg,#f7efe3_0%,#efdfca_100%)] p-5 shadow-[0_20px_40px_rgba(143,59,30,0.08)]">
        <Link to="/workouts/new" className="text-sm font-medium text-[var(--color-brand-deep)]">
          返回动作选择
        </Link>
        <div className="mt-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-brand-deep)]">
              Training Entry
            </p>
            <h2 className="mt-2 text-xl font-bold text-[var(--color-ink)]">{exercise.name}</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
              <span className="whitespace-nowrap">{getBodyPartLabel(exercise.bodyPart)}</span>
              <span> · 只保留组数、重量、次数和备注，录入更快。</span>
            </p>
          </div>
          <span className="whitespace-nowrap rounded-full bg-white/80 px-3 py-2 text-xs font-semibold text-[var(--color-brand-deep)]">
            {getBodyPartLabel(exercise.bodyPart)}
          </span>
        </div>
      </header>

      <section className="rounded-[1.7rem] border border-[var(--color-line)] bg-white p-5 shadow-[0_12px_28px_rgba(24,33,38,0.06)]">
        <WorkoutEntryForm
          date={selectedDate}
          exercise={exercise}
          isSubmitting={isSubmitting}
          submitError={error}
          onDateChange={setSelectedDate}
          onSubmit={handleSubmit}
        />
      </section>

      <section className="rounded-[1.7rem] border border-[var(--color-line)] bg-white p-5 shadow-[0_12px_28px_rgba(24,33,38,0.06)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-[var(--color-ink)]">当天记录</h3>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              {dayjs(selectedDate).format('YYYY 年 M 月 D 日')} · 共 {entryCards.length} 条记录
            </p>
          </div>
        </div>

        {entryCards.length === 0 ? (
          <p className="mt-4 rounded-2xl bg-[var(--color-card)] px-4 py-4 text-sm text-[var(--color-muted)]">
            这一天还没有训练记录，先保存第一条。
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {entryCards.map((entry) => (
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
                      {entry.exercise ? getBodyPartLabel(entry.exercise.bodyPart) : '动作已不在动作库中'}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {entry.sets !== null ? <Metric label="组数" value={String(entry.sets)} /> : null}
                    {entry.weight !== null ? <Metric label="重量" value={`${entry.weight} kg`} /> : null}
                    {entry.reps !== null ? <Metric label="次数" value={String(entry.reps)} /> : null}
                  </div>
                </div>

                {entry.notes ? (
                  <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">{entry.notes}</p>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  )
}

function Metric(props: { label: string; value: string }) {
  return (
    <div className="rounded-full bg-white px-3 py-2 text-sm text-[var(--color-ink)] ring-1 ring-[var(--color-line)]">
      <span className="font-semibold">{props.label}</span>
      <span className="ml-2 text-[var(--color-muted)]">{props.value}</span>
    </div>
  )
}
