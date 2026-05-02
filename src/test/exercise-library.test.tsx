import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { resetAppDb } from '../db/client'
import { createExercise, ensureStarterExercises, listExercises } from '../features/exercises/service'
import { ExerciseLibraryPage } from '../pages/ExerciseLibraryPage'

describe('ExerciseLibraryPage', () => {
  beforeEach(async () => {
    await resetAppDb()
  })

  afterEach(async () => {
    await resetAppDb()
  })

  it('seeds starter exercises on first load and renders grouped categories', async () => {
    render(
      <MemoryRouter>
        <ExerciseLibraryPage />
      </MemoryRouter>,
    )

    expect((await screen.findAllByText('杠铃卧推')).length).toBeGreaterThan(0)
    expect(screen.getAllByText('史密斯卧推').length).toBeGreaterThan(0)
    expect(screen.getAllByText('蝴蝶机夹胸').length).toBeGreaterThan(0)
    expect(screen.getAllByText('下腰').length).toBeGreaterThan(0)

    expect(screen.getByRole('link', { name: /胸部/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /背部/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /核心/i })).toBeInTheDocument()

    expect(screen.getAllByRole('link', { name: '编辑' }).length).toBeGreaterThan(10)
    expect(screen.getAllByRole('button', { name: '删除' }).length).toBeGreaterThan(10)
  })

  it('fills missing starter exercises into an existing partial library', async () => {
    await createExercise({
      name: '杠铃卧推',
      bodyPart: 'chest',
      exerciseType: 'strength',
      notes: '已有旧数据',
      isPreset: true,
      illustrationKey: 'old-shared-image',
    })

    await ensureStarterExercises()

    const exercises = await listExercises()
    const chestExercises = exercises.filter((exercise) => exercise.bodyPart === 'chest')
    const coreExercises = exercises.filter((exercise) => exercise.bodyPart === 'core')
    const smithBench = exercises.find((exercise) => exercise.name === '史密斯卧推')
    const backExtension = exercises.find((exercise) => exercise.name === '下腰')

    expect(chestExercises.length).toBeGreaterThanOrEqual(8)
    expect(coreExercises.length).toBeGreaterThanOrEqual(7)
    expect(smithBench?.illustrationKey).toBe('smith-machine-bench-press')
    expect(backExtension?.illustrationKey).toBe('hyperextensions-back-extensions')
  })
})
