import dayjs from 'dayjs'
import type { Exercise, WorkoutEntry } from '../../db/schema'

export type WorkoutEntryWithExercise = WorkoutEntry & {
  exercise?: Exercise
}

export type WorkoutEntriesByDateGroup = {
  date: string
  entries: WorkoutEntryWithExercise[]
}

export function joinWorkoutEntriesWithExercises(
  entries: WorkoutEntry[],
  exercises: Exercise[],
): WorkoutEntryWithExercise[] {
  const exerciseMap = new Map(exercises.map((exercise) => [exercise.id, exercise]))

  return entries.map((entry) => ({
    ...entry,
    exercise: exerciseMap.get(entry.exerciseId),
  }))
}

export function groupWorkoutEntriesByDate(entries: WorkoutEntryWithExercise[]): WorkoutEntriesByDateGroup[] {
  const groups = new Map<string, WorkoutEntryWithExercise[]>()

  for (const entry of entries) {
    const group = groups.get(entry.date) ?? []
    group.push(entry)
    groups.set(entry.date, group)
  }

  return [...groups.entries()]
    .sort(([leftDate], [rightDate]) => rightDate.localeCompare(leftDate))
    .map(([date, dateEntries]) => ({
      date,
      entries: [...dateEntries].sort((left, right) => right.createdAt.localeCompare(left.createdAt)),
    }))
}

export function formatWorkoutDate(date: string) {
  return dayjs(date).format('M月D日')
}

export function formatWorkoutDateWithWeekday(date: string) {
  return dayjs(date).format('YYYY年M月D日 dddd')
}
