import { zodResolver } from '@hookform/resolvers/zod'
import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import type { Exercise } from '../../../db/schema'
import { bodyPartOptions, exerciseTypeOptions } from '../options'
import { exerciseFormSchema, type ExerciseFormInput, type ExerciseFormValues } from '../schema'

type ExerciseFormProps = {
  initialValues?: Exercise | null
  isSubmitting?: boolean
  submitError?: string | null
  onSubmit: (values: ExerciseFormValues) => Promise<void> | void
}

export function ExerciseForm({
  initialValues,
  isSubmitting = false,
  submitError,
  onSubmit,
}: ExerciseFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ExerciseFormInput, undefined, ExerciseFormValues>({
    resolver: zodResolver(exerciseFormSchema),
    defaultValues: {
      name: initialValues?.name ?? '',
      bodyPart: initialValues?.bodyPart ?? 'chest',
      exerciseType: initialValues?.exerciseType ?? 'strength',
      notes: initialValues?.notes ?? '',
    },
  })

  useEffect(() => {
    reset({
      name: initialValues?.name ?? '',
      bodyPart: initialValues?.bodyPart ?? 'chest',
      exerciseType: initialValues?.exerciseType ?? 'strength',
      notes: initialValues?.notes ?? '',
    })
  }, [initialValues, reset])

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <Field label="动作名称" htmlFor="name" error={errors.name?.message}>
        <input
          id="name"
          type="text"
          placeholder="例如：杠铃深蹲"
          className="w-full rounded-2xl border border-[var(--color-line)] bg-[var(--color-card)] px-4 py-3 text-sm outline-none transition focus:border-[var(--color-brand)] focus:bg-white"
          {...register('name')}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="训练部位" htmlFor="bodyPart" error={errors.bodyPart?.message}>
          <select
            id="bodyPart"
            className="w-full rounded-2xl border border-[var(--color-line)] bg-[var(--color-card)] px-4 py-3 text-sm outline-none transition focus:border-[var(--color-brand)] focus:bg-white"
            {...register('bodyPart')}
          >
            {bodyPartOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="动作类型" htmlFor="exerciseType" error={errors.exerciseType?.message}>
          <select
            id="exerciseType"
            className="w-full rounded-2xl border border-[var(--color-line)] bg-[var(--color-card)] px-4 py-3 text-sm outline-none transition focus:border-[var(--color-brand)] focus:bg-white"
            {...register('exerciseType')}
          >
            {exerciseTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="备注" htmlFor="notes" error={errors.notes?.message}>
        <textarea
          id="notes"
          rows={4}
          placeholder="例如：高脚杯深蹲热身后再做正式组"
          className="w-full rounded-2xl border border-[var(--color-line)] bg-[var(--color-card)] px-4 py-3 text-sm outline-none transition focus:border-[var(--color-brand)] focus:bg-white"
          {...register('notes')}
        />
      </Field>

      {submitError ? (
        <p className="rounded-2xl bg-[rgba(143,59,30,0.12)] px-4 py-3 text-sm text-[var(--color-brand-deep)]">
          {submitError}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-2xl bg-[var(--color-brand)] px-4 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? '保存中...' : '保存动作'}
      </button>
    </form>
  )
}

type FieldProps = {
  children: ReactNode
  error?: string
  htmlFor: string
  label: string
}

function Field({ children, error, htmlFor, label }: FieldProps) {
  return (
    <label className="block" htmlFor={htmlFor}>
      <span className="mb-2 block text-sm font-medium text-[var(--color-ink)]">{label}</span>
      {children}
      {error ? <span className="mt-2 block text-xs text-[var(--color-brand-deep)]">{error}</span> : null}
    </label>
  )
}
