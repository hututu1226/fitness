import { deleteDB, openDB, type IDBPDatabase } from 'idb'
import {
  DB_NAME,
  DB_VERSION,
  EXERCISES_STORE,
  WORKOUT_ENTRIES_STORE,
  type FitnessAppDB,
} from './schema'

const dbCache = new Map<string, Promise<IDBPDatabase<FitnessAppDB>>>()

function createDatabase(dbName: string) {
  return openDB<FitnessAppDB>(dbName, DB_VERSION, {
    upgrade(database) {
      if (!database.objectStoreNames.contains(EXERCISES_STORE)) {
        const exerciseStore = database.createObjectStore(EXERCISES_STORE, {
          keyPath: 'id',
        })

        exerciseStore.createIndex('by-name', 'name', { unique: true })
        exerciseStore.createIndex('by-body-part', 'bodyPart')
        exerciseStore.createIndex('by-type', 'exerciseType')
        exerciseStore.createIndex('by-updated-at', 'updatedAt')
      }

      if (!database.objectStoreNames.contains(WORKOUT_ENTRIES_STORE)) {
        const workoutEntryStore = database.createObjectStore(WORKOUT_ENTRIES_STORE, {
          keyPath: 'id',
        })

        workoutEntryStore.createIndex('by-date', 'date')
        workoutEntryStore.createIndex('by-exercise-id', 'exerciseId')
        workoutEntryStore.createIndex('by-exercise-id-date', ['exerciseId', 'date'])
        workoutEntryStore.createIndex('by-created-at', 'createdAt')
      }
    },
  })
}

export function getAppDb(dbName = DB_NAME) {
  const cached = dbCache.get(dbName)

  if (cached) {
    return cached
  }

  const databasePromise = createDatabase(dbName)
  dbCache.set(dbName, databasePromise)
  return databasePromise
}

export async function resetAppDb(dbName = DB_NAME) {
  const cached = dbCache.get(dbName)
  const db = cached ? await cached.catch(() => undefined) : undefined

  db?.close()
  await deleteDB(dbName)
  dbCache.delete(dbName)
}
