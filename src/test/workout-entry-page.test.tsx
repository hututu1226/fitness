import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { resetAppDb } from '../db/client'
import { createExercise } from '../features/exercises/service'
import { WorkoutEntryPage } from '../pages/WorkoutEntryPage'
import { WorkoutExercisePickerPage } from '../pages/WorkoutExercisePickerPage'

describe('Workout entry flow', () => {
  beforeEach(async () => {
    await resetAppDb()
  })

  afterEach(async () => {
    await resetAppDb()
  })

  it('selects an exercise first, then creates a workout entry', async () => {
    const exercise = await createExercise({
      name: '杠铃深蹲',
      bodyPart: 'legs',
      exerciseType: 'strength',
      notes: '基础下肢动作',
    })

    render(
      <MemoryRouter initialEntries={['/workouts/new']}>
        <Routes>
          <Route path="/workouts/new" element={<WorkoutExercisePickerPage />} />
          <Route path="/workouts/new/:exerciseId" element={<WorkoutEntryPage />} />
        </Routes>
      </MemoryRouter>,
    )

    await userEvent.click(await screen.findByRole('link', { name: /杠铃深蹲/ }))

    expect(await screen.findByRole('heading', { name: '杠铃深蹲' })).toBeInTheDocument()
    expect(screen.queryByLabelText('动作')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('时长 (秒)')).not.toBeInTheDocument()

    await userEvent.clear(screen.getByLabelText('组数'))
    await userEvent.type(screen.getByLabelText('组数'), '4')
    await userEvent.clear(screen.getByLabelText('重量 (kg)'))
    await userEvent.type(screen.getByLabelText('重量 (kg)'), '100')
    await userEvent.clear(screen.getByLabelText('次数'))
    await userEvent.type(screen.getByLabelText('次数'), '8')
    await userEvent.type(screen.getByLabelText('备注'), '最后一组很吃力')

    await userEvent.click(screen.getByRole('button', { name: '保存训练记录' }))

    await waitFor(() => {
      expect(screen.getByText('最后一组很吃力')).toBeInTheDocument()
      expect(screen.getByText('100 kg')).toBeInTheDocument()
    })

    expect(exercise.name).toBe('杠铃深蹲')
  })
})
