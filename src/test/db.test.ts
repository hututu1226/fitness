import {
  createExercise,
  getExerciseById,
  listExercises,
  softDeleteExercise,
  updateExercise,
} from '../features/exercises/service'
import {
  createWorkoutEntry,
  deleteWorkoutEntry,
  getWorkoutEntryById,
  listWorkoutEntriesByDate,
  listWorkoutEntriesByExercise,
  updateWorkoutEntry,
} from '../features/workouts/service'
import { resetAppDb } from '../db/client'

describe('IndexedDB services', () => {
  beforeEach(async () => {
    await resetAppDb()
  })

  afterEach(async () => {
    await resetAppDb()
  })

  it('creates, updates, lists, and soft deletes exercises', async () => {
    const squat = await createExercise({
      name: 'Barbell Squat',
      bodyPart: 'legs',
      exerciseType: 'strength',
      notes: 'Heavy day',
    })

    const listedBeforeUpdate = await listExercises()
    expect(listedBeforeUpdate).toHaveLength(1)
    expect(listedBeforeUpdate[0]?.name).toBe('Barbell Squat')

    const updated = await updateExercise(squat.id, {
      notes: 'Heavy day and pause reps',
    })

    expect(updated.notes).toBe('Heavy day and pause reps')

    const stored = await getExerciseById(squat.id)
    expect(stored?.notes).toBe('Heavy day and pause reps')

    await softDeleteExercise(squat.id)

    expect(await listExercises()).toHaveLength(0)
    expect(await listExercises({ includeDeleted: true })).toHaveLength(1)
  })

  it('creates, queries, updates, and deletes workout entries', async () => {
    const deadlift = await createExercise({
      name: 'Deadlift',
      bodyPart: 'back',
      exerciseType: 'strength',
    })

    const entry = await createWorkoutEntry({
      exerciseId: deadlift.id,
      date: '2026-05-02',
      sets: 5,
      weight: 140,
      reps: 3,
      notes: 'Top sets',
    })

    await createWorkoutEntry({
      exerciseId: deadlift.id,
      date: '2026-05-03',
      sets: 3,
      weight: 120,
      reps: 5,
      notes: 'Backoff work',
    })

    const byDate = await listWorkoutEntriesByDate('2026-05-02')
    expect(byDate).toHaveLength(1)
    expect(byDate[0]?.weight).toBe(140)

    const byExercise = await listWorkoutEntriesByExercise(deadlift.id)
    expect(byExercise).toHaveLength(2)
    expect(byExercise[0]?.date).toBe('2026-05-03')

    const updatedEntry = await updateWorkoutEntry(entry.id, {
      weight: 145,
      durationSec: 900,
    })

    expect(updatedEntry.weight).toBe(145)
    expect(updatedEntry.durationSec).toBe(900)

    const storedEntry = await getWorkoutEntryById(entry.id)
    expect(storedEntry?.weight).toBe(145)

    await deleteWorkoutEntry(entry.id)
    expect(await getWorkoutEntryById(entry.id)).toBeUndefined()
  })
})
