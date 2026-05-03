import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import type { Exercise, WorkoutEntry } from '../db/schema'
import { getBodyPartLabel } from '../features/exercises/options'
import { getExerciseById } from '../features/exercises/service'
import { getAppPreferences, type AppPreferences } from '../features/settings/preferences'
import { WorkoutEntryForm } from '../features/workouts/components/WorkoutEntryForm'
import type { WorkoutEntryFormValues } from '../features/workouts/schema'
import { deleteWorkoutEntry, getWorkoutEntryById, updateWorkoutEntry } from '../features/workouts/service'

export function WorkoutEntryEditPage() {
  const { entryId } = useParams()
  const navigate = useNavigate()
  const [exercise, setExercise] = useState<Exercise | null>(null)
  const [entry, setEntry] = useState<WorkoutEntry | null>(null)
  const [preferences] = useState<AppPreferences>(getAppPreferences())
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isActive = true

    void (async () => {
      if (!entryId) {
        setError('没有找到要编辑的训练记录。')
        setIsLoading(false)
        return
      }

      try {
        const nextEntry = await getWorkoutEntryById(entryId)

        if (!isActive) {
          return
        }

        if (!nextEntry) {
          setError('这条训练记录不存在。')
          setIsLoading(false)
          return
        }

        const nextExercise = await getExerciseById(nextEntry.exerciseId)

        if (!isActive) {
          return
        }

        if (!nextExercise || nextExercise.isDeleted) {
          setError('这条训练记录关联的动作已经不存在。')
          setIsLoading(false)
          return
        }

        setEntry(nextEntry)
        setExercise(nextExercise)
      } catch {
        if (isActive) {
          setError('训练记录加载失败，请稍后重试。')
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
  }, [entryId])

  async function handleSubmit(values: WorkoutEntryFormValues) {
    if (!entryId) {
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      await updateWorkoutEntry(entryId, values)
      navigate('/stats')
    } catch {
      setError('更新训练记录失败，请稍后重试。')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!entryId || !entry) {
      return
    }

    const confirmed = window.confirm(`确定删除 ${dayjs(entry.date).format('M月D日')} 的这条训练记录吗？`)

    if (!confirmed) {
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      await deleteWorkoutEntry(entryId)
      navigate('/stats')
    } catch {
      setError('删除训练记录失败，请稍后重试。')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <section className="rounded-3xl border border-dashed border-[var(--color-line)] bg-white p-5">
        <p className="text-sm text-[var(--color-muted)]">正在读取训练记录...</p>
      </section>
    )
  }

  if (!entry || !exercise) {
    return (
      <section className="rounded-[1.7rem] border border-[var(--color-line)] bg-white p-5 shadow-[0_12px_28px_rgba(24,33,38,0.06)]">
        <h2 className="text-xl font-bold text-[var(--color-ink)]">无法编辑训练记录</h2>
        <p className="mt-2 text-sm text-[var(--color-muted)]">{error ?? '请返回历史记录页重新选择。'}</p>
        <Link
          to="/stats"
          className="mt-4 inline-flex rounded-full bg-[var(--color-brand)] px-4 py-2 text-sm font-semibold text-white"
        >
          返回统计
        </Link>
      </section>
    )
  }

  return (
    <section className="space-y-4">
      <header className="rounded-[2rem] bg-[linear-gradient(180deg,#f7efe3_0%,#efdfca_100%)] p-5 shadow-[0_20px_40px_rgba(143,59,30,0.08)]">
        <Link to="/stats" className="text-sm font-medium text-[var(--color-brand-deep)]">
          返回统计
        </Link>
        <div className="mt-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-brand-deep)]">
              Edit Entry
            </p>
            <h2 className="mt-2 text-xl font-bold text-[var(--color-ink)]">{exercise.name}</h2>
            <p className="mt-2 text-sm text-[var(--color-muted)]">
              {dayjs(entry.date).format('YYYY年M月D日')} · {getBodyPartLabel(exercise.bodyPart)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void handleDelete()}
            disabled={isSubmitting}
            className="rounded-full bg-[rgba(143,59,30,0.12)] px-4 py-2 text-sm font-semibold text-[var(--color-brand-deep)] disabled:opacity-60"
          >
            删除
          </button>
        </div>
      </header>

      <section className="rounded-[1.7rem] border border-[var(--color-line)] bg-white p-5 shadow-[0_12px_28px_rgba(24,33,38,0.06)]">
        <WorkoutEntryForm
          date={entry.date}
          exercise={exercise}
          isSubmitting={isSubmitting}
          submitError={error}
          onDateChange={() => {}}
          onSubmit={handleSubmit}
          resetAfterSubmit={false}
          submitLabel="保存修改"
          initialValues={{
            exerciseId: entry.exerciseId,
            date: entry.date,
            sets: entry.sets,
            weight: entry.weight,
            reps: entry.reps,
            notes: entry.notes,
          }}
          weightUnitLabel={preferences.weightUnit}
        />
      </section>
    </section>
  )
}
