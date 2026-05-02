import { resetAppDb } from '../db/client'
import { createExercise } from '../features/exercises/service'
import { clearAppData, exportAppData, getAppDataSummary, importAppData } from '../features/settings/service'
import { createWorkoutEntry } from '../features/workouts/service'

describe('settings data management', () => {
  beforeEach(async () => {
    await resetAppDb()
  })

  afterEach(async () => {
    await resetAppDb()
  })

  it('exports, clears, and imports app data', async () => {
    const bench = await createExercise({
      name: '杠铃卧推',
      bodyPart: 'chest',
      exerciseType: 'strength',
      notes: '胸部基础动作',
    })

    await createWorkoutEntry({
      exerciseId: bench.id,
      date: '2026-05-02',
      sets: 4,
      weight: 80,
      reps: 8,
      notes: '胸部主练',
    })

    const exported = await exportAppData()
    expect(exported.exercises).toHaveLength(1)
    expect(exported.workoutEntries).toHaveLength(1)

    await clearAppData()

    const clearedSummary = await getAppDataSummary()
    expect(clearedSummary.exerciseCount).toBe(0)
    expect(clearedSummary.workoutEntryCount).toBe(0)

    await importAppData(exported)

    const restoredSummary = await getAppDataSummary()
    expect(restoredSummary.exerciseCount).toBe(1)
    expect(restoredSummary.workoutEntryCount).toBe(1)
    expect(restoredSummary.trainedDayCount).toBe(1)
  })
})
