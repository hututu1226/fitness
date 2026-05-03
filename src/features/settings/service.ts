import { getAppDb, resetAppDb } from '../../db/client'
import {
  DB_VERSION,
  EXERCISES_STORE,
  WORKOUT_ENTRIES_STORE,
  type Exercise,
  type WorkoutEntry,
} from '../../db/schema'

export type AppDataExport = {
  meta: {
    exportedAt: string
    version: number
  }
  exercises: Exercise[]
  workoutEntries: WorkoutEntry[]
}

export async function exportAppData(): Promise<AppDataExport> {
  const db = await getAppDb()
  const [exercises, workoutEntries] = await Promise.all([
    db.getAll(EXERCISES_STORE),
    db.getAll(WORKOUT_ENTRIES_STORE),
  ])

  return {
    meta: {
      exportedAt: new Date().toISOString(),
      version: DB_VERSION,
    },
    exercises,
    workoutEntries,
  }
}

export async function importAppData(payload: AppDataExport) {
  if (!payload || !Array.isArray(payload.exercises) || !Array.isArray(payload.workoutEntries)) {
    throw new Error('导入文件格式不正确')
  }

  const db = await getAppDb()
  const transaction = db.transaction([EXERCISES_STORE, WORKOUT_ENTRIES_STORE], 'readwrite')

  await transaction.objectStore(EXERCISES_STORE).clear()
  await transaction.objectStore(WORKOUT_ENTRIES_STORE).clear()

  for (const exercise of payload.exercises) {
    await transaction.objectStore(EXERCISES_STORE).put(exercise)
  }

  for (const entry of payload.workoutEntries) {
    await transaction.objectStore(WORKOUT_ENTRIES_STORE).put(entry)
  }

  await transaction.done
}

export async function clearAppData() {
  await resetAppDb()
}

export async function getAppDataSummary() {
  const data = await exportAppData()
  const trainedDays = new Set(data.workoutEntries.map((entry) => entry.date)).size

  const latestUpdatedAt = [...data.exercises, ...data.workoutEntries]
    .map((item) => item.updatedAt)
    .sort((left, right) => right.localeCompare(left))[0] ?? null

  return {
    exerciseCount: data.exercises.filter((exercise) => !exercise.isDeleted).length,
    workoutEntryCount: data.workoutEntries.length,
    trainedDayCount: trainedDays,
    exportVersion: data.meta.version,
    lastUpdatedAt: latestUpdatedAt,
  }
}
