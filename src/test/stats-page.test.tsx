import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { resetAppDb } from '../db/client'
import { createExercise } from '../features/exercises/service'
import { createWorkoutEntry } from '../features/workouts/service'
import { StatsPage } from '../pages/StatsPage'

describe('StatsPage', () => {
  beforeEach(async () => {
    await resetAppDb()
  })

  afterEach(async () => {
    await resetAppDb()
  })

  it('shows stats by default and can switch to history records', async () => {
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

    render(
      <MemoryRouter>
        <StatsPage />
      </MemoryRouter>,
    )

    expect(await screen.findByRole('heading', { name: '统计' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '历史记录' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '统计' })).toBeInTheDocument()
    expect(screen.getByText('总次数')).toBeInTheDocument()
    expect(screen.getByText('总天数')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '周统计' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '月统计' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '年统计' })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: '历史记录' }))

    expect(await screen.findByText('共 1 条训练记录')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '杠铃卧推' })).toBeInTheDocument()
    expect(screen.getByText('胸部')).toBeInTheDocument()
    expect(screen.getByText('胸部主练')).toBeInTheDocument()
  })
})
