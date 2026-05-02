import { getAppDb } from '../../db/client'
import {
  EXERCISES_STORE,
  type CreateExerciseInput,
  type Exercise,
  type UpdateExerciseInput,
} from '../../db/schema'
import { createId } from '../../lib/id'
import { starterExercises } from './starterExercises'

let starterExerciseImportPromise: Promise<{ created: number; restored: number }> | null = null

function normalizeName(name: string) {
  return name.trim().toLowerCase()
}

function createExerciseRecord(input: CreateExerciseInput): Exercise {
  const now = new Date().toISOString()

  return {
    id: createId(),
    name: input.name.trim(),
    bodyPart: input.bodyPart,
    exerciseType: input.exerciseType,
    notes: input.notes?.trim() ?? '',
    illustrationKey: input.illustrationKey,
    isPreset: input.isPreset ?? false,
    createdAt: now,
    updatedAt: now,
    isDeleted: false,
  }
}

export async function listExercises(options?: { includeDeleted?: boolean }) {
  const db = await getAppDb()
  const exercises = await db.getAllFromIndex(EXERCISES_STORE, 'by-name')

  if (options?.includeDeleted) {
    return exercises
  }

  return exercises.filter((exercise) => !exercise.isDeleted)
}

export async function getExerciseById(exerciseId: string) {
  const db = await getAppDb()
  return db.get(EXERCISES_STORE, exerciseId)
}

export async function createExercise(input: CreateExerciseInput) {
  const db = await getAppDb()
  const exercise = createExerciseRecord(input)

  await db.add(EXERCISES_STORE, exercise)
  return exercise
}

export async function updateExercise(exerciseId: string, input: UpdateExerciseInput) {
  const db = await getAppDb()
  const current = await db.get(EXERCISES_STORE, exerciseId)

  if (!current) {
    throw new Error(`Exercise not found: ${exerciseId}`)
  }

  const updatedExercise: Exercise = {
    ...current,
    name: input.name?.trim() ?? current.name,
    bodyPart: input.bodyPart ?? current.bodyPart,
    exerciseType: input.exerciseType ?? current.exerciseType,
    notes: input.notes?.trim() ?? current.notes,
    illustrationKey: input.illustrationKey ?? current.illustrationKey,
    isPreset: input.isPreset ?? current.isPreset,
    updatedAt: new Date().toISOString(),
  }

  await db.put(EXERCISES_STORE, updatedExercise)
  return updatedExercise
}

export async function softDeleteExercise(exerciseId: string) {
  const db = await getAppDb()
  const exercise = await db.get(EXERCISES_STORE, exerciseId)

  if (!exercise) {
    throw new Error(`Exercise not found: ${exerciseId}`)
  }

  const deletedExercise: Exercise = {
    ...exercise,
    isDeleted: true,
    updatedAt: new Date().toISOString(),
  }

  await db.put(EXERCISES_STORE, deletedExercise)
  return deletedExercise
}

export async function ensureStarterExercises() {
  if (!starterExerciseImportPromise) {
    starterExerciseImportPromise = importStarterExercises().finally(() => {
      starterExerciseImportPromise = null
    })
  }

  return starterExerciseImportPromise
}

export async function importStarterExercises() {
  const db = await getAppDb()
  const existing = await db.getAllFromIndex(EXERCISES_STORE, 'by-name')
  const byName = new Map(existing.map((exercise) => [normalizeName(exercise.name), exercise]))

  let created = 0
  let restored = 0

  for (const preset of starterExercises) {
    const key = normalizeName(preset.name)
    const current = byName.get(key)

    if (!current) {
      try {
        const createdExercise = createExerciseRecord(preset)
        await db.add(EXERCISES_STORE, createdExercise)
        byName.set(key, createdExercise)
        created += 1
      } catch {
        const latest = await db.getAllFromIndex(EXERCISES_STORE, 'by-name')
        const latestMatch = latest.find((exercise) => normalizeName(exercise.name) === key)

        if (!latestMatch) {
          throw new Error(`Failed to seed preset exercise: ${preset.name}`)
        }

        byName.set(key, latestMatch)
      }

      continue
    }

    if (current.isDeleted) {
      await db.put(EXERCISES_STORE, {
        ...current,
        bodyPart: preset.bodyPart,
        exerciseType: preset.exerciseType,
        notes: preset.notes?.trim() ?? '',
        illustrationKey: preset.illustrationKey,
        isPreset: true,
        isDeleted: false,
        updatedAt: new Date().toISOString(),
      })
      restored += 1
      continue
    }

    const shouldSyncPreset =
      current.bodyPart !== preset.bodyPart ||
      current.exerciseType !== preset.exerciseType ||
      current.notes !== (preset.notes?.trim() ?? '') ||
      current.illustrationKey !== preset.illustrationKey ||
      current.isPreset !== true

    if (shouldSyncPreset) {
      await db.put(EXERCISES_STORE, {
        ...current,
        bodyPart: preset.bodyPart,
        exerciseType: preset.exerciseType,
        notes: preset.notes?.trim() ?? '',
        illustrationKey: preset.illustrationKey,
        isPreset: true,
        updatedAt: new Date().toISOString(),
      })
    }
  }

  return { created, restored }
}
