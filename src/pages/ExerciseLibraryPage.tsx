import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { BodyPart, Exercise } from '../db/schema'
import { ExerciseIllustration } from '../features/exercises/components/ExerciseIllustration'
import { getBodyPartLabel, getExerciseTypeLabel } from '../features/exercises/options'
import { ensureStarterExercises, listExercises, softDeleteExercise } from '../features/exercises/service'

const bodyPartOrder: BodyPart[] = ['chest', 'back', 'legs', 'shoulders', 'arms', 'core']

export function ExerciseLibraryPage() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function loadExercises() {
    const nextExercises = await listExercises()
    setExercises(nextExercises)
    return nextExercises
  }

  async function handleDelete(exercise: Exercise) {
    const confirmed = window.confirm(`确定删除动作“${exercise.name}”吗？`)

    if (!confirmed) {
      return
    }

    setDeletingId(exercise.id)
    setError(null)

    try {
      await softDeleteExercise(exercise.id)
      await loadExercises()
    } catch {
      setError('删除失败，请稍后重试。')
    } finally {
      setDeletingId(null)
    }
  }

  const groupedExercises = useMemo(() => {
    return bodyPartOrder
      .map((bodyPart) => ({
        bodyPart,
        title: getBodyPartLabel(bodyPart),
        items: exercises.filter((exercise) => exercise.bodyPart === bodyPart),
      }))
      .filter((group) => group.items.length > 0)
  }, [exercises])

  useEffect(() => {
    let isActive = true

    void (async () => {
      try {
        await ensureStarterExercises()
        const nextExercises = await listExercises()

        if (!isActive) {
          return
        }

        setExercises(nextExercises)
      } catch {
        if (!isActive) {
          return
        }

        setError('动作列表加载失败，请稍后重试。')
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

  return (
    <section className="space-y-4">
      <header className="rounded-[2rem] bg-[linear-gradient(180deg,#f7efe3_0%,#efdfca_100%)] p-5 shadow-[0_20px_40px_rgba(143,59,30,0.08)]">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-brand-deep)]">
              Exercise Atlas
            </p>
            <h2 className="mt-2 text-xl font-bold text-[var(--color-ink)]">动作库</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
              每个部位都预置了基础动作，图片走本地素材，离线也能正常看。
            </p>
          </div>

          <Link
            to="/exercises/new"
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
        <StateCard title="正在读取动作库" description="我正在从本地数据库里加载动作数据。" />
      ) : null}

      {!isLoading && groupedExercises.length === 0 ? (
        <StateCard title="动作库还是空的" description="先点右上角加号，建立你的第一个动作。" />
      ) : null}

      {!isLoading && groupedExercises.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-[8.5rem_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-4 lg:self-start">
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-3 lg:grid-cols-1">
              {groupedExercises.map((group) => (
                <a
                  key={group.bodyPart}
                  href={`#section-${group.bodyPart}`}
                  className="flex min-w-0 flex-col items-center justify-center gap-1 rounded-[1.4rem] border border-[var(--color-line)] bg-white px-2 py-3 text-center text-sm font-semibold text-[var(--color-ink)] transition hover:border-[var(--color-brand)]"
                >
                  <span>{group.title}</span>
                  <span className="text-xs text-[var(--color-muted)]">{group.items.length}</span>
                </a>
              ))}
            </div>
          </aside>

          <div className="space-y-6">
            {groupedExercises.map((group) => (
              <section key={group.bodyPart} id={`section-${group.bodyPart}`} className="space-y-3 scroll-mt-6">
                <div>
                  <h3 className="text-lg font-bold text-[var(--color-ink)]">{group.title}</h3>
                  <p className="mt-1 text-sm text-[var(--color-muted)]">
                    当前收录 {group.items.length} 个基础动作
                  </p>
                </div>

                <div className="grid gap-3 xl:grid-cols-2">
                  {group.items.map((exercise) => (
                    <article
                      key={exercise.id}
                      className="rounded-[1.7rem] border border-[var(--color-line)] bg-white p-4 shadow-[0_12px_28px_rgba(24,33,38,0.06)]"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row">
                        <div className="w-full shrink-0 sm:w-28">
                          <ExerciseIllustration exercise={exercise} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="text-base font-semibold text-[var(--color-ink)]">{exercise.name}</h4>
                              {exercise.isPreset ? <Badge>基础</Badge> : null}
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              <Tag>{group.title}</Tag>
                              <Tag>{getExerciseTypeLabel(exercise.exerciseType)}</Tag>
                            </div>
                          </div>

                          <p className="mt-3 break-words text-sm leading-6 text-[var(--color-muted)]">
                            {exercise.notes || '还没有备注。'}
                          </p>

                          <div className="mt-4 flex flex-wrap gap-2">
                            <ActionLink to={`/exercises/${exercise.id}/edit`}>编辑</ActionLink>
                            <ActionButton
                              disabled={deletingId === exercise.id}
                              tone="danger"
                              onClick={() => void handleDelete(exercise)}
                            >
                              {deletingId === exercise.id ? '处理中...' : '删除'}
                            </ActionButton>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  )
}

function StateCard(props: { title: string; description: string }) {
  return (
    <section className="rounded-3xl border border-dashed border-[var(--color-line)] bg-white p-5">
      <h3 className="text-base font-semibold text-[var(--color-ink)]">{props.title}</h3>
      <p className="mt-2 text-sm text-[var(--color-muted)]">{props.description}</p>
    </section>
  )
}

function Tag(props: { children: ReactNode }) {
  return (
    <span className="rounded-full bg-[rgba(216,105,61,0.12)] px-3 py-1 text-xs font-medium text-[var(--color-brand-deep)]">
      {props.children}
    </span>
  )
}

function Badge(props: { children: ReactNode }) {
  return (
    <span className="rounded-full bg-[rgba(56,84,95,0.12)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-ink)]">
      {props.children}
    </span>
  )
}

const actionBaseClass =
  'inline-flex h-9 min-w-16 items-center justify-center rounded-full px-3 text-sm font-semibold leading-none whitespace-nowrap transition disabled:cursor-not-allowed disabled:opacity-60'

function ActionLink(props: { children: ReactNode; to: string }) {
  return (
    <Link
      to={props.to}
      className={`${actionBaseClass} border border-[var(--color-line)] text-[var(--color-ink)] hover:border-[var(--color-brand)]`}
    >
      {props.children}
    </Link>
  )
}

function ActionButton(props: {
  children: ReactNode
  disabled?: boolean
  onClick: () => void
  tone?: 'default' | 'danger'
}) {
  return (
    <button
      type="button"
      disabled={props.disabled}
      onClick={props.onClick}
      className={[
        actionBaseClass,
        props.tone === 'danger'
          ? 'bg-[rgba(143,59,30,0.12)] text-[var(--color-brand-deep)] hover:bg-[rgba(143,59,30,0.18)]'
          : 'border border-[var(--color-line)] text-[var(--color-ink)]',
      ].join(' ')}
    >
      {props.children}
    </button>
  )
}
