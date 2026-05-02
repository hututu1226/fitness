import { z } from 'zod'
import { BODY_PARTS, EXERCISE_TYPES } from '../../db/schema'

export const exerciseFormSchema = z.object({
  name: z.string().trim().min(1, '请输入动作名称').max(60, '动作名称不要超过 60 个字符'),
  bodyPart: z.enum(BODY_PARTS, {
    error: '请选择训练部位',
  }),
  exerciseType: z.enum(EXERCISE_TYPES, {
    error: '请选择动作类型',
  }),
  notes: z.string().max(240, '备注不要超过 240 个字符').default(''),
})

export type ExerciseFormInput = z.input<typeof exerciseFormSchema>
export type ExerciseFormValues = z.output<typeof exerciseFormSchema>
