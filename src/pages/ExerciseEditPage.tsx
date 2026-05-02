import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import type { Exercise } from '../db/schema'
import { ExerciseForm } from '../features/exercises/components/ExerciseForm'
import { createExercise, getExerciseById, updateExercise } from '../features/exercises/service'
import type { ExerciseFormValues } from '../features/exercises/schema'

type ExerciseEditPageProps = {
  mode: 'create' | 'edit'
}

export function ExerciseEditPage({ mode }: ExerciseEditPageProps) {
  const navigate = useNavigate()
  const { id } = useParams()
  const [exercise, setExercise] = useState<Exercise | null>(null)
  const [isLoading, setIsLoading] = useState(mode === 'edit')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (mode !== 'edit' || !id) {
      return
    }

    let isActive = true

    void (async () => {
      try {
        const result = await getExerciseById(id)

        if (!isActive) {
          return
        }

        if (!result || result.isDeleted) {
          setError('没有找到这个动作，可能已经被删除。')
          setExercise(null)
          setIsLoading(false)
          return
        }

        setExercise(result)
      } catch {
        if (!isActive) {
          return
        }

        setError('动作信息加载失败，请稍后重试。')
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    })()

    return () => {
      isActive = false
    }
  }, [id, mode])

  async function handleSubmit(values: ExerciseFormValues) {
    setIsSubmitting(true)
    setError(null)

    try {
      if (mode === 'create') {
        await createExercise(values)
      } else if (id) {
        await updateExercise(id, values)
      }

      navigate('/exercises')
    } catch {
      setError('保存失败，请稍后重试。')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return <StateCard title="正在加载动作信息" description="编辑页需要先从本地数据库取回当前动作。" />
  }

  return (
    <section className="space-y-4">
      <header className="rounded-3xl bg-[var(--color-surface)] p-5">
        <Link to="/exercises" className="text-sm font-medium text-[var(--color-brand-deep)]">
          返回动作库
        </Link>
        <h2 className="mt-3 text-xl font-bold text-[var(--color-ink)]">
          {mode === 'create' ? '新增动作' : '编辑动作'}
        </h2>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          把动作名称、训练部位和备注整理好，后面记录训练时会更省事。
        </p>
      </header>

      {mode === 'edit' && error && !exercise ? (
        <StateCard title="动作不可用" description={error} />
      ) : (
        <section className="rounded-3xl border border-[var(--color-line)] bg-white p-5">
          <ExerciseForm
            initialValues={exercise}
            isSubmitting={isSubmitting}
            submitError={error}
            onSubmit={handleSubmit}
          />
        </section>
      )}
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
