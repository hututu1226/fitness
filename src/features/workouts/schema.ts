import { z } from 'zod'

function optionalNonNegativeNumber(label: string) {
  return z
    .union([z.literal(''), z.coerce.number().min(0, `${label}不能小于 0`), z.null()])
    .transform((value) => (value === '' ? null : value))
}

export const workoutEntryFormSchema = z.object({
  exerciseId: z.string().min(1, '请选择动作'),
  date: z.string().min(1, '请选择日期'),
  sets: optionalNonNegativeNumber('组数'),
  weight: optionalNonNegativeNumber('重量'),
  reps: optionalNonNegativeNumber('次数'),
  notes: z.string().max(240, '备注不要超过 240 个字符').default(''),
})

export type WorkoutEntryFormInput = z.input<typeof workoutEntryFormSchema>
export type WorkoutEntryFormValues = z.output<typeof workoutEntryFormSchema>
