import { useEffect, useMemo, useState } from 'react'
import type { Exercise, WorkoutEntry } from '../db/schema'
import { getBodyPartLabel } from '../features/exercises/options'
import { listExercises } from '../features/exercises/service'
import { listWorkoutEntries } from '../features/workouts/service'
import { joinWorkoutEntriesWithExercises } from '../features/workouts/selectors'

export function ExerciseHistoryPage() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [entries, setEntries] = useState<WorkoutEntry[]>([])
  const [selectedExerciseId, setSelectedExerciseId] = useState('')
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
        setSelectedExerciseId(nextExercises[0]?.id ?? '')
      } catch {
        if (isActive) {
          setError('动作历史加载失败，请稍后重试。')
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

  const filteredEntries = useMemo(() => {
    const joinedEntries = joinWorkoutEntriesWithExercises(entries, exercises)
    return joinedEntries.filter((entry) => !selectedExerciseId || entry.exerciseId === selectedExerciseId)
  }, [entries, exercises, selectedExerciseId])

  const selectedExercise = exercises.find((exercise) => exercise.id === selectedExerciseId)

  return (
    <section className="space-y-4">
      <header className="rounded-[2rem] bg-[linear-gradient(180deg,#f7efe3_0%,#efdfca_100%)] p-5 shadow-[0_20px_40px_rgba(143,59,30,0.08)]">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-brand-deep)]">
          Exercise History
        </p>
        <h2 className="mt-2 text-xl font-bold text-[var(--color-ink)]">按动作查看历史</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
          选一个动作，就能看到它被记录过多少次、在哪些日期出现过。
        </p>
      </header>

      {error ? (
        <p className="rounded-2xl bg-[rgba(143,59,30,0.12)] px-4 py-3 text-sm text-[var(--color-brand-deep)]">
          {error}
        </p>
      ) : null}

      <section className="rounded-[1.7rem] border border-[var(--color-line)] bg-white p-5 shadow-[0_12px_28px_rgba(24,33,38,0.06)]">
        <label className="block" htmlFor="exercise-filter">
          <span className="mb-2 block text-sm font-medium text-[var(--color-ink)]">选择动作</span>
          <select
            id="exercise-filter"
            value={selectedExerciseId}
            onChange={(event) => setSelectedExerciseId(event.target.value)}
            className="w-full rounded-2xl border border-[var(--color-line)] bg-[var(--color-card)] px-4 py-3 text-sm outline-none transition focus:border-[var(--color-brand)] focus:bg-white"
          >
            {exercises.map((exercise) => (
              <option key={exercise.id} value={exercise.id}>
                {exercise.name} · {getBodyPartLabel(exercise.bodyPart)}
              </option>
            ))}
          </select>
        </label>
      </section>

      {isLoading ? (
        <section className="rounded-3xl border border-dashed border-[var(--color-line)] bg-white p-5">
          <p className="text-sm text-[var(--color-muted)]">正在读取动作历史...</p>
        </section>
      ) : null}

      {!isLoading && exercises.length === 0 ? (
        <section className="rounded-3xl border border-dashed border-[var(--color-line)] bg-white p-5">
          <p className="text-sm text-[var(--color-muted)]">动作库还是空的，先去“动作”页添加或使用默认动作。</p>
        </section>
      ) : null}

      {!isLoading && exercises.length > 0 ? (
        <section className="rounded-[1.7rem] border border-[var(--color-line)] bg-white p-5 shadow-[0_12px_28px_rgba(24,33,38,0.06)]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-[var(--color-ink)]">{selectedExercise?.name ?? '未选择动作'}</h3>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                {selectedExercise ? getBodyPartLabel(selectedExercise.bodyPart) : '请选择一个动作'}
              </p>
            </div>
            <span className="rounded-full bg-[rgba(216,105,61,0.12)] px-3 py-1 text-xs font-medium text-[var(--color-brand-deep)]">
              共 {filteredEntries.length} 条记录
            </span>
          </div>

          {filteredEntries.length === 0 ? (
            <p className="mt-4 rounded-2xl bg-[var(--color-card)] px-4 py-4 text-sm text-[var(--color-muted)]">
              这个动作还没有训练记录。
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {filteredEntries.map((entry) => (
                <article
                  key={entry.id}
                  className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-card)] p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h4 className="text-base font-semibold text-[var(--color-ink)]">{entry.date}</h4>
                      <p className="mt-1 text-sm text-[var(--color-muted)]">
                        {entry.sets !== null ? `${entry.sets} 组` : '组数未填'}
                        {entry.weight !== null ? ` · ${entry.weight} kg` : ''}
                        {entry.reps !== null ? ` · ${entry.reps} 次` : ''}
                        {entry.durationSec !== null ? ` · ${entry.durationSec} 秒` : ''}
                      </p>
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
      ) : null}
    </section>
  )
}
