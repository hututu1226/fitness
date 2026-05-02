import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import type { Exercise } from '../../../db/schema'
import {
  workoutEntryFormSchema,
  type WorkoutEntryFormInput,
  type WorkoutEntryFormValues,
} from '../schema'

type WorkoutEntryFormProps = {
  date: string
  exercise: Exercise
  isSubmitting?: boolean
  submitError?: string | null
  onDateChange: (value: string) => void
  onSubmit: (values: WorkoutEntryFormValues) => Promise<void> | void
}

export function WorkoutEntryForm({
  date,
  exercise,
  isSubmitting = false,
  submitError,
  onDateChange,
  onSubmit,
}: WorkoutEntryFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<WorkoutEntryFormInput, undefined, WorkoutEntryFormValues>({
    resolver: zodResolver(workoutEntryFormSchema),
    defaultValues: {
      exerciseId: exercise.id,
      date,
      sets: '',
      weight: '',
      reps: '',
      notes: '',
    },
  })

  useEffect(() => {
    setValue('date', date)
    setValue('exerciseId', exercise.id)
  }, [date, exercise.id, setValue])

  async function handleValidSubmit(values: WorkoutEntryFormValues) {
    await onSubmit(values)
    reset({
      exerciseId: exercise.id,
      date: values.date,
      sets: '',
      weight: '',
      reps: '',
      notes: '',
    })
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit(handleValidSubmit)}>
      <input type="hidden" {...register('exerciseId')} />

      <Field label="训练日期" htmlFor="date" error={errors.date?.message}>
        <input
          id="date"
          type="date"
          className="w-full rounded-2xl border border-[var(--color-line)] bg-[var(--color-card)] px-4 py-3 text-sm outline-none transition focus:border-[var(--color-brand)] focus:bg-white"
          {...register('date')}
          onChange={(event) => {
            register('date').onChange(event)
            onDateChange(event.target.value)
          }}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="组数" htmlFor="sets" error={errors.sets?.message}>
          <input
            id="sets"
            type="number"
            min="0"
            inputMode="numeric"
            placeholder="例如 4"
            className="w-full rounded-2xl border border-[var(--color-line)] bg-[var(--color-card)] px-4 py-3 text-sm outline-none transition focus:border-[var(--color-brand)] focus:bg-white"
            {...register('sets')}
          />
        </Field>

        <Field label="重量 (kg)" htmlFor="weight" error={errors.weight?.message}>
          <input
            id="weight"
            type="number"
            min="0"
            step="0.5"
            inputMode="decimal"
            placeholder="例如 80"
            className="w-full rounded-2xl border border-[var(--color-line)] bg-[var(--color-card)] px-4 py-3 text-sm outline-none transition focus:border-[var(--color-brand)] focus:bg-white"
            {...register('weight')}
          />
        </Field>

        <Field label="次数" htmlFor="reps" error={errors.reps?.message}>
          <input
            id="reps"
            type="number"
            min="0"
            inputMode="numeric"
            placeholder="例如 10"
            className="w-full rounded-2xl border border-[var(--color-line)] bg-[var(--color-card)] px-4 py-3 text-sm outline-none transition focus:border-[var(--color-brand)] focus:bg-white"
            {...register('reps')}
          />
        </Field>
      </div>

      <Field label="备注" htmlFor="notes" error={errors.notes?.message}>
        <textarea
          id="notes"
          rows={3}
          placeholder="例如：最后一组接近力竭"
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
        {isSubmitting ? '保存中...' : '保存训练记录'}
      </button>
    </form>
  )
}

type FieldProps = {
  children: React.ReactNode
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
