import type { DBSchema } from 'idb'

export const DB_NAME = 'fitness-pwa-app'
export const DB_VERSION = 1
export const EXERCISES_STORE = 'exercises'
export const WORKOUT_ENTRIES_STORE = 'workout_entries'

export const BODY_PARTS = [
  'chest',
  'back',
  'legs',
  'shoulders',
  'arms',
  'core',
  'full_body',
  'other',
] as const

export const EXERCISE_TYPES = [
  'strength',
  'cardio',
  'bodyweight',
  'mobility',
  'other',
] as const

export type BodyPart = (typeof BODY_PARTS)[number]
export type ExerciseType = (typeof EXERCISE_TYPES)[number]

export type Exercise = {
  id: string
  name: string
  bodyPart: BodyPart
  exerciseType: ExerciseType
  notes: string
  illustrationKey?: string
  isPreset?: boolean
  createdAt: string
  updatedAt: string
  isDeleted: boolean
}

export type WorkoutEntry = {
  id: string
  exerciseId: string
  date: string
  sets: number | null
  weight: number | null
  reps: number | null
  durationSec: number | null
  notes: string
  createdAt: string
  updatedAt: string
}

export type CreateExerciseInput = {
  name: string
  bodyPart: BodyPart
  exerciseType: ExerciseType
  notes?: string
  illustrationKey?: string
  isPreset?: boolean
}

export type UpdateExerciseInput = Partial<CreateExerciseInput>

export type CreateWorkoutEntryInput = {
  exerciseId: string
  date: string
  sets?: number | null
  weight?: number | null
  reps?: number | null
  durationSec?: number | null
  notes?: string
}

export type UpdateWorkoutEntryInput = Partial<CreateWorkoutEntryInput>

export interface FitnessAppDB extends DBSchema {
  [EXERCISES_STORE]: {
    key: string
    value: Exercise
    indexes: {
      'by-name': string
      'by-body-part': BodyPart
      'by-type': ExerciseType
      'by-updated-at': string
    }
  }
  [WORKOUT_ENTRIES_STORE]: {
    key: string
    value: WorkoutEntry
    indexes: {
      'by-date': string
      'by-exercise-id': string
      'by-exercise-id-date': [string, string]
      'by-created-at': string
    }
  }
}
