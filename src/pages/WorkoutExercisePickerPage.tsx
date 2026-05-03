import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { BodyPart, Exercise, WorkoutEntry } from '../db/schema'
import { ExerciseIllustration } from '../features/exercises/components/ExerciseIllustration'
import { getBodyPartLabel, getExerciseTypeLabel } from '../features/exercises/options'
import { ensureStarterExercises, listExercises } from '../features/exercises/service'
import { joinWorkoutEntriesWithExercises } from '../features/workouts/selectors'
import { listRecentWorkoutEntries } from '../features/workouts/service'

const bodyPartOrder: BodyPart[] = ['chest', 'back', 'legs', 'shoulders', 'arms', 'core']

export function WorkoutExercisePickerPage() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [recentEntries, setRecentEntries] = useState<WorkoutEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeBodyPart, setActiveBodyPart] = useState<BodyPart>('chest')
  const sectionRefs = useRef<Partial<Record<BodyPart, HTMLElement | null>>>({})

  const groupedExercises = useMemo(() => {
    return bodyPartOrder
      .map((bodyPart) => ({
        bodyPart,
        title: getBodyPartLabel(bodyPart),
        items: exercises.filter((exercise) => exercise.bodyPart === bodyPart),
      }))
      .filter((group) => group.items.length > 0)
  }, [exercises])

  const recentFavoriteExercises = useMemo(() => {
    const joined = joinWorkoutEntriesWithExercises(recentEntries, exercises)
    const seen = new Set<string>()
    const scored = new Map<string, { exercise: Exercise; score: number; latestAt: string }>()

    for (const entry of joined) {
      if (!entry.exercise || entry.exercise.isDeleted) {
        continue
      }

      const current = scored.get(entry.exercise.id)

      if (!current) {
        scored.set(entry.exercise.id, {
          exercise: entry.exercise,
          score: 1,
          latestAt: entry.createdAt,
        })
      } else {
        current.score += 1
        if (entry.createdAt > current.latestAt) {
          current.latestAt = entry.createdAt
        }
      }
    }

    return [...scored.values()]
      .sort((left, right) => right.score - left.score || right.latestAt.localeCompare(left.latestAt))
      .map((item) => item.exercise)
      .filter((exercise) => {
        if (seen.has(exercise.id)) {
          return false
        }

        seen.add(exercise.id)
        return true
      })
      .slice(0, 4)
  }, [exercises, recentEntries])

  useEffect(() => {
    let isActive = true

    void (async () => {
      try {
        try {
          await ensureStarterExercises()
        } catch {
          // 多页面同时补齐预置动作时，直接继续读取已存在的数据即可。
        }

        const [nextExercises, nextEntries] = await Promise.all([listExercises(), listRecentWorkoutEntries(40)])

        if (!isActive) {
          return
        }

        setExercises(nextExercises)
        setRecentEntries(nextEntries)

        if (nextExercises.length === 0) {
          setError('动作列表还是空的。如果你刚从线上地址打开，请刷新一次页面重试。')
          return
        }

        const firstBodyPart = bodyPartOrder.find((bodyPart) =>
          nextExercises.some((exercise) => exercise.bodyPart === bodyPart),
        )

        if (firstBodyPart) {
          setActiveBodyPart(firstBodyPart)
        }
      } catch {
        if (isActive) {
          setError('动作列表加载失败，请稍后重试。')
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

  useEffect(() => {
    if (groupedExercises.length === 0 || typeof IntersectionObserver === 'undefined') {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0]

        if (visible?.target instanceof HTMLElement) {
          const nextBodyPart = visible.target.dataset.bodyPart as BodyPart | undefined
          if (nextBodyPart) {
            setActiveBodyPart(nextBodyPart)
          }
        }
      },
      {
        rootMargin: '-84px 0px -50% 0px',
        threshold: [0.2, 0.35, 0.6],
      },
    )

    for (const group of groupedExercises) {
      const section = sectionRefs.current[group.bodyPart]
      if (section) {
        observer.observe(section)
      }
    }

    return () => {
      observer.disconnect()
    }
  }, [groupedExercises])

  function scrollToGroup(bodyPart: BodyPart) {
    setActiveBodyPart(bodyPart)
    sectionRefs.current[bodyPart]?.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
  }

  return (
    <section className="space-y-4">
      <header className="rounded-[2rem] bg-[linear-gradient(180deg,#f7efe3_0%,#efdfca_100%)] p-5 shadow-[0_20px_40px_rgba(143,59,30,0.08)]">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-brand-deep)]">
              Choose Exercise
            </p>
            <h2 className="mt-2 text-xl font-bold text-[var(--color-ink)]">选择动作</h2>
          </div>
          <Link
            to="/exercises/new?returnTo=/workouts/new"
            aria-label="新增动作"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand)] text-3xl leading-none text-white shadow-[0_14px_30px_rgba(216,105,61,0.28)]"
          >
            +
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
          <p className="text-sm text-[var(--color-muted)]">正在读取动作库...</p>
        </section>
      ) : null}

      {!isLoading && recentFavoriteExercises.length > 0 ? (
        <section className="rounded-[1.7rem] border border-[var(--color-line)] bg-white p-5 shadow-[0_12px_28px_rgba(24,33,38,0.06)]">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-bold text-[var(--color-ink)]">最近常用</h3>
            <span className="text-xs text-[var(--color-muted)]">优先展示最近最常练的动作</span>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {recentFavoriteExercises.map((exercise) => (
              <ExerciseCard key={`recent-${exercise.id}`} exercise={exercise} />
            ))}
          </div>
        </section>
      ) : null}

      {!isLoading && groupedExercises.length > 0 ? (
        <div className="space-y-6">
          <div className="sticky top-0 z-10 -mx-4 border-b border-[var(--color-line)] bg-[rgba(255,250,241,0.96)] px-4 py-3 backdrop-blur md:-mx-5 md:px-5 lg:-mx-6 lg:px-6">
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {groupedExercises.map((group) => (
                <button
                  key={group.bodyPart}
                  type="button"
                  onClick={() => scrollToGroup(group.bodyPart)}
                  className={[
                    'flex min-w-0 flex-col items-center justify-center gap-1 rounded-[1.4rem] border px-2 py-3 text-center text-sm font-semibold shadow-[0_8px_20px_rgba(24,33,38,0.05)] transition',
                    activeBodyPart === group.bodyPart
                      ? 'border-[var(--color-brand)] bg-[rgba(216,105,61,0.12)] text-[var(--color-brand-deep)]'
                      : 'border-[var(--color-line)] bg-white text-[var(--color-ink)]',
                  ].join(' ')}
                >
                  <span>{group.title}</span>
                  <span className="text-xs text-[var(--color-muted)]">{group.items.length}</span>
                </button>
              ))}
            </div>
          </div>

          {groupedExercises.map((group) => (
            <section
              key={group.bodyPart}
              ref={(node) => {
                sectionRefs.current[group.bodyPart] = node
              }}
              data-body-part={group.bodyPart}
              className="space-y-3 scroll-mt-24"
            >
              <div>
                <h3 className="text-lg font-bold text-[var(--color-ink)]">{group.title}</h3>
              </div>

              <div className="grid gap-3 xl:grid-cols-2">
                {group.items.map((exercise) => (
                  <ExerciseCard key={exercise.id} exercise={exercise} />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : null}
    </section>
  )
}

function ExerciseCard(props: { exercise: Exercise }) {
  return (
    <Link
      to={`/workouts/new/${props.exercise.id}`}
      className="rounded-[1.7rem] border border-[var(--color-line)] bg-white p-4 shadow-[0_12px_28px_rgba(24,33,38,0.06)] transition hover:border-[var(--color-brand)]"
    >
      <div className="flex items-start gap-3">
        <div className="w-[5.5rem] shrink-0 sm:w-24">
          <ExerciseIllustration exercise={props.exercise} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-base font-semibold text-[var(--color-ink)]">{props.exercise.name}</h4>
            {props.exercise.isPreset ? (
              <span className="rounded-full bg-[rgba(56,84,95,0.12)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-ink)]">
                基础
              </span>
            ) : null}
          </div>

          <div className="mt-2 flex flex-wrap gap-2">
            <span className="whitespace-nowrap rounded-full bg-[rgba(216,105,61,0.12)] px-3 py-1 text-xs font-medium text-[var(--color-brand-deep)]">
              {getBodyPartLabel(props.exercise.bodyPart)}
            </span>
            <span className="whitespace-nowrap rounded-full bg-[rgba(216,105,61,0.12)] px-3 py-1 text-xs font-medium text-[var(--color-brand-deep)]">
              {getExerciseTypeLabel(props.exercise.exerciseType)}
            </span>
          </div>

          <p className="mt-3 break-words text-sm leading-6 text-[var(--color-muted)]">
            {props.exercise.notes || '点开后填写组数、重量和次数。'}
          </p>
        </div>
      </div>
    </Link>
  )
}
