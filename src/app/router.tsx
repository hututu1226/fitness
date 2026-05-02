import { createHashRouter, Navigate } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'
import { ExerciseEditPage } from '../pages/ExerciseEditPage'
import { ExerciseLibraryPage } from '../pages/ExerciseLibraryPage'
import { ExerciseHistoryPage } from '../pages/ExerciseHistoryPage'
import { HistoryPage } from '../pages/HistoryPage'
import { SettingsPage } from '../pages/SettingsPage'
import { StatsPage } from '../pages/StatsPage'
import { WorkoutExercisePickerPage } from '../pages/WorkoutExercisePickerPage'
import { WorkoutEntryPage } from '../pages/WorkoutEntryPage'

export const router = createHashRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/stats" replace /> },
      { path: 'exercises', element: <ExerciseLibraryPage /> },
      { path: 'exercises/new', element: <ExerciseEditPage mode="create" /> },
      { path: 'exercises/:id/edit', element: <ExerciseEditPage mode="edit" /> },
      { path: 'workouts/new', element: <WorkoutExercisePickerPage /> },
      { path: 'workouts/new/:exerciseId', element: <WorkoutEntryPage /> },
      { path: 'history', element: <HistoryPage /> },
      { path: 'history/exercise', element: <ExerciseHistoryPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: 'stats', element: <StatsPage /> },
    ],
  },
])
