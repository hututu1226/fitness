import type { Exercise } from '../../../db/schema'

const gifModules = import.meta.glob('../../../assets/exercise-gifs/*.gif', {
  eager: true,
  import: 'default',
}) as Record<string, string>

const gifMap = Object.fromEntries(
  Object.entries(gifModules).map(([path, url]) => {
    const fileName = path.split('/').pop() ?? ''
    const assetKey = fileName.replace(/\.gif$/, '')
    return [assetKey, url]
  }),
)

type ExerciseIllustrationProps = {
  exercise: Exercise
}

export function ExerciseIllustration({ exercise }: ExerciseIllustrationProps) {
  const imageSrc = exercise.illustrationKey ? gifMap[exercise.illustrationKey] : undefined

  if (!imageSrc) {
    return (
      <div className="flex aspect-square w-full items-center justify-center rounded-2xl border border-[var(--color-line)] bg-[#fffaf2] text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
        No Media
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[#fffaf2]">
      <img
        src={imageSrc}
        alt={`${exercise.name} 动作演示`}
        className="block aspect-square h-full w-full object-cover object-center"
        loading="lazy"
      />
    </div>
  )
}
