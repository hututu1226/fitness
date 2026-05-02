import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { resetAppDb } from '../db/client'
import { createExercise } from '../features/exercises/service'
import { createWorkoutEntry } from '../features/workouts/service'
import { HistoryPage } from '../pages/HistoryPage'

describe('HistoryPage', () => {
  beforeEach(async () => {
    await resetAppDb()
  })

  afterEach(async () => {
    await resetAppDb()
  })

  it('shows saved workout entries grouped in history', async () => {
    const exercise = await createExercise({
      name: '杠铃卧推',
      bodyPart: 'chest',
      exerciseType: 'strength',
      notes: '胸部基础动作',
    })

    await createWorkoutEntry({
      exerciseId: exercise.id,
      date: '2026-05-02',
      sets: 4,
      weight: 80,
      reps: 8,
      notes: '今天状态不错',
    })

    render(
      <MemoryRouter>
        <HistoryPage />
      </MemoryRouter>,
    )

    expect(await screen.findByText('杠铃卧推')).toBeInTheDocument()
    expect(screen.getByText('今天状态不错')).toBeInTheDocument()
    expect(screen.getByText('80 kg')).toBeInTheDocument()
  })
})
