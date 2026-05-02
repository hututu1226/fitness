import { BODY_PARTS, EXERCISE_TYPES, type BodyPart, type ExerciseType } from '../../db/schema'

export const bodyPartOptions: Array<{ value: BodyPart; label: string }> = [
  { value: BODY_PARTS[0], label: '胸部' },
  { value: BODY_PARTS[1], label: '背部' },
  { value: BODY_PARTS[2], label: '腿部' },
  { value: BODY_PARTS[3], label: '肩部' },
  { value: BODY_PARTS[4], label: '手臂' },
  { value: BODY_PARTS[5], label: '核心' },
  { value: BODY_PARTS[6], label: '全身' },
  { value: BODY_PARTS[7], label: '其他' },
]

export const exerciseTypeOptions: Array<{ value: ExerciseType; label: string }> = [
  { value: EXERCISE_TYPES[0], label: '力量' },
  { value: EXERCISE_TYPES[1], label: '有氧' },
  { value: EXERCISE_TYPES[2], label: '自重' },
  { value: EXERCISE_TYPES[3], label: '灵活性' },
  { value: EXERCISE_TYPES[4], label: '其他' },
]

export function getBodyPartLabel(value: BodyPart) {
  return bodyPartOptions.find((option) => option.value === value)?.label ?? value
}

export function getExerciseTypeLabel(value: ExerciseType) {
  return exerciseTypeOptions.find((option) => option.value === value)?.label ?? value
}
