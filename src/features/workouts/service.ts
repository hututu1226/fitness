import { getAppDb } from '../../db/client'
import {
  WORKOUT_ENTRIES_STORE,
  type CreateWorkoutEntryInput,
  type UpdateWorkoutEntryInput,
  type WorkoutEntry,
} from '../../db/schema'
import { createId } from '../../lib/id'

function createWorkoutEntryRecord(input: CreateWorkoutEntryInput): WorkoutEntry {
  const now = new Date().toISOString()

  return {
    id: createId(),
    exerciseId: input.exerciseId,
    date: input.date,
    sets: input.sets ?? null,
    weight: input.weight ?? null,
    reps: input.reps ?? null,
    durationSec: input.durationSec ?? null,
    notes: input.notes?.trim() ?? '',
    createdAt: now,
    updatedAt: now,
  }
}

function sortWorkoutEntries(entries: WorkoutEntry[]) {
  return [...entries].sort((left, right) => right.date.localeCompare(left.date))
}

export async function createWorkoutEntry(input: CreateWorkoutEntryInput) {
  const db = await getAppDb()
  const workoutEntry = createWorkoutEntryRecord(input)

  await db.add(WORKOUT_ENTRIES_STORE, workoutEntry)
  return workoutEntry
}

export async function updateWorkoutEntry(entryId: string, input: UpdateWorkoutEntryInput) {
  const db = await getAppDb()
  const current = await db.get(WORKOUT_ENTRIES_STORE, entryId)

  if (!current) {
    throw new Error(`Workout entry not found: ${entryId}`)
  }

  const updatedEntry: WorkoutEntry = {
    ...current,
    exerciseId: input.exerciseId ?? current.exerciseId,
    date: input.date ?? current.date,
    sets: input.sets === undefined ? current.sets : input.sets,
    weight: input.weight === undefined ? current.weight : input.weight,
    reps: input.reps === undefined ? current.reps : input.reps,
    durationSec: input.durationSec === undefined ? current.durationSec : input.durationSec,
    notes: input.notes?.trim() ?? current.notes,
    updatedAt: new Date().toISOString(),
  }

  await db.put(WORKOUT_ENTRIES_STORE, updatedEntry)
  return updatedEntry
}

export async function getWorkoutEntryById(entryId: string) {
  const db = await getAppDb()
  return db.get(WORKOUT_ENTRIES_STORE, entryId)
}

export async function listWorkoutEntries() {
  const db = await getAppDb()
  const entries = await db.getAllFromIndex(WORKOUT_ENTRIES_STORE, 'by-created-at')
  return sortWorkoutEntries(entries)
}

export async function listWorkoutEntriesByDate(date: string) {
  const db = await getAppDb()
  const entries = await db.getAllFromIndex(WORKOUT_ENTRIES_STORE, 'by-date', date)
  return sortWorkoutEntries(entries)
}

export async function listWorkoutEntriesByExercise(exerciseId: string) {
  const db = await getAppDb()
  const entries = await db.getAllFromIndex(WORKOUT_ENTRIES_STORE, 'by-exercise-id', exerciseId)
  return sortWorkoutEntries(entries)
}

export async function listRecentWorkoutEntries(limit = 12) {
  const entries = await listWorkoutEntries()
  return entries.slice(0, limit)
}

export async function deleteWorkoutEntry(entryId: string) {
  const db = await getAppDb()
  await db.delete(WORKOUT_ENTRIES_STORE, entryId)
}
