import dayjs from 'dayjs'
import { useEffect, useMemo, useState } from 'react'
import type { Exercise, WorkoutEntry } from '../db/schema'
import { getBodyPartLabel } from '../features/exercises/options'
import { listExercises } from '../features/exercises/service'
import { listWorkoutEntries } from '../features/workouts/service'
import { groupWorkoutEntriesByDate, joinWorkoutEntriesWithExercises } from '../features/workouts/selectors'

type CalendarDay = {
  date: string
  dayNumber: number
  inCurrentMonth: boolean
  bodyParts: string[]
  entryCount: number
}

const weekdayLabels = ['一', '二', '三', '四', '五', '六', '日']

export function HomePage() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [entries, setEntries] = useState<WorkoutEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cursorMonth, setCursorMonth] = useState(dayjs().startOf('month'))

  useEffect(() => {
    let isActive = true

    void (async () => {
      try {
        const [nextExercises, nextEntries] = await Promise.all([listExercises(), listWorkoutEntries()])

        if (!isActive) {
          return
        }

        setExercises(nextExercises)
        setEntries(nextEntries)
      } catch {
        if (isActive) {
          setError('首页训练日历加载失败，请稍后重试。')
        }
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    })()

    return () => {
      isActive = false
    }
  }, [])

  const joinedEntries = useMemo(() => joinWorkoutEntriesWithExercises(entries, exercises), [entries, exercises])

  const summary = useMemo(() => {
    const today = dayjs().format('YYYY-MM-DD')
    const thisWeekStart = dayjs().startOf('week')

    const todayEntries = joinedEntries.filter((entry) => entry.date === today)
    const thisWeekEntries = joinedEntries.filter((entry) =>
      dayjs(entry.date).isAfter(thisWeekStart.subtract(1, 'day'), 'day'),
    )

    return {
      trainedDays: new Set(thisWeekEntries.map((entry) => entry.date)).size,
      totalEntries: thisWeekEntries.length,
      todayBodyParts: [...new Set(todayEntries.map((entry) => entry.exercise?.bodyPart).filter(Boolean))].map(
        (bodyPart) => getBodyPartLabel(bodyPart as Exercise['bodyPart']),
      ),
    }
  }, [joinedEntries])

  const recentGroups = useMemo(
    () => groupWorkoutEntriesByDate(joinedEntries).slice(0, 3),
    [joinedEntries],
  )

  const calendarDays = useMemo(() => {
    const monthStart = cursorMonth.startOf('month')
    const monthEnd = cursorMonth.endOf('month')
    const calendarStart = monthStart.startOf('week').add(1, 'day')
    const calendarEnd = monthEnd.endOf('week').add(1, 'day')
    const trainingMap = new Map<string, { bodyParts: Set<string>; entryCount: number }>()

    for (const entry of joinedEntries) {
      const bodyPart = entry.exercise ? getBodyPartLabel(entry.exercise.bodyPart) : '未知'
      const bucket = trainingMap.get(entry.date) ?? { bodyParts: new Set<string>(), entryCount: 0 }
      bucket.bodyParts.add(bodyPart)
      bucket.entryCount += 1
      trainingMap.set(entry.date, bucket)
    }

    const days: CalendarDay[] = []
    let pointer = calendarStart

    while (pointer.isBefore(calendarEnd) || pointer.isSame(calendarEnd, 'day')) {
      const isoDate = pointer.format('YYYY-MM-DD')
      const info = trainingMap.get(isoDate)

      days.push({
        date: isoDate,
        dayNumber: pointer.date(),
        inCurrentMonth: pointer.month() === cursorMonth.month(),
        bodyParts: info ? [...info.bodyParts] : [],
        entryCount: info?.entryCount ?? 0,
      })

      pointer = pointer.add(1, 'day')
    }

    return days
  }, [cursorMonth, joinedEntries])

  return (
    <section className="space-y-4">
      <header className="rounded-[2rem] bg-[linear-gradient(180deg,#f7efe3_0%,#efdfca_100%)] p-5 shadow-[0_20px_40px_rgba(143,59,30,0.08)]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-brand-deep)]">
              Training Calendar
            </p>
            <h2 className="mt-2 text-xl font-bold text-[var(--color-ink)]">先看本月训练分布</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
              这个月哪天练过、练了哪些部位，先从首页一眼看清。
            </p>
          </div>
          <div className="rounded-full bg-white/80 px-3 py-2 text-xs font-semibold text-[var(--color-brand-deep)]">
            {summary.trainedDays} 天
          </div>
        </div>
      </header>

      {error ? (
        <p className="rounded-2xl bg-[rgba(143,59,30,0.12)] px-4 py-3 text-sm text-[var(--color-brand-deep)]">
          {error}
        </p>
      ) : null}

      <section className="rounded-[1.7rem] border border-[var(--color-line)] bg-white p-4 shadow-[0_12px_28px_rgba(24,33,38,0.06)] sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setCursorMonth((value) => value.subtract(1, 'month'))}
            className="rounded-full border border-[var(--color-line)] px-3 py-2 text-sm font-medium text-[var(--color-ink)]"
          >
            上月
          </button>

          <div className="text-center">
            <h3 className="text-lg font-bold text-[var(--color-ink)]">{cursorMonth.format('YYYY 年 M 月')}</h3>
            <p className="text-xs text-[var(--color-muted)]">有训练的日期会高亮显示</p>
          </div>

          <button
            type="button"
            onClick={() => setCursorMonth((value) => value.add(1, 'month'))}
            className="rounded-full border border-[var(--color-line)] px-3 py-2 text-sm font-medium text-[var(--color-ink)]"
          >
            下月
          </button>
        </div>

        <div className="mt-4 grid grid-cols-7 gap-2 text-center text-xs font-semibold text-[var(--color-muted)]">
          {weekdayLabels.map((label) => (
            <div key={label}>{label}</div>
          ))}
        </div>

        <div className="mt-2 grid grid-cols-7 gap-2">
          {calendarDays.map((day) => {
            const isToday = day.date === dayjs().format('YYYY-MM-DD')
            const hasTraining = day.entryCount > 0

            return (
              <article
                key={day.date}
                className={[
                  'min-h-24 rounded-2xl border p-2 text-left transition sm:min-h-28',
                  hasTraining
                    ? 'border-[rgba(216,105,61,0.28)] bg-[rgba(216,105,61,0.10)]'
                    : 'border-[var(--color-line)] bg-[var(--color-card)]',
                  !day.inCurrentMonth ? 'opacity-45' : '',
                  isToday ? 'ring-2 ring-[var(--color-brand)] ring-offset-1 ring-offset-white' : '',
                ].join(' ')}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-sm font-semibold text-[var(--color-ink)]">{day.dayNumber}</span>
                  {hasTraining ? (
                    <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-[var(--color-brand-deep)]">
                      {day.entryCount} 条
                    </span>
                  ) : null}
                </div>

                <div className="mt-2 space-y-1">
                  {day.bodyParts.slice(0, 2).map((bodyPart) => (
                    <div
                      key={bodyPart}
                      className="truncate rounded-full bg-white px-2 py-1 text-[10px] font-medium text-[var(--color-brand-deep)]"
                    >
                      {bodyPart}
                    </div>
                  ))}
                  {day.bodyParts.length > 2 ? (
                    <div className="text-[10px] text-[var(--color-muted)]">+{day.bodyParts.length - 2} 个部位</div>
                  ) : null}
                </div>
              </article>
            )
          })}
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryCard label="本周训练日" value={`${summary.trainedDays} 天`} />
        <SummaryCard label="本周记录数" value={`${summary.totalEntries} 条`} />
        <SummaryCard
          label="今天练了"
          value={summary.todayBodyParts.length > 0 ? summary.todayBodyParts.join(' / ') : '今天还没记录'}
        />
      </div>

      <section className="rounded-[1.7rem] border border-[var(--color-line)] bg-white p-5 shadow-[0_12px_28px_rgba(24,33,38,0.06)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-brand-deep)]">
              Recent Logs
            </p>
            <h3 className="mt-2 text-lg font-bold text-[var(--color-ink)]">最近训练</h3>
          </div>
        </div>

        {isLoading ? <p className="mt-4 text-sm text-[var(--color-muted)]">正在读取训练数据...</p> : null}

        {!isLoading && recentGroups.length === 0 ? (
          <p className="mt-4 rounded-2xl bg-[var(--color-card)] px-4 py-4 text-sm text-[var(--color-muted)]">
            还没有训练记录。底部点“新增训练”就能开始录入。
          </p>
        ) : null}

        {!isLoading && recentGroups.length > 0 ? (
          <div className="mt-4 space-y-4">
            {recentGroups.map((group) => (
              <article key={group.date} className="rounded-2xl bg-[var(--color-card)] p-4">
                <div className="flex items-center justify-between gap-3">
                  <h4 className="text-base font-semibold text-[var(--color-ink)]">
                    {dayjs(group.date).format('M 月 D 日')}
                  </h4>
                  <span className="text-xs text-[var(--color-muted)]">{group.entries.length} 条记录</span>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {group.entries.map((entry) => (
                    <span
                      key={entry.id}
                      className="rounded-full bg-white px-3 py-1 text-xs font-medium text-[var(--color-ink)]"
                    >
                      {entry.exercise?.name ?? '未知动作'}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </section>
  )
}

function SummaryCard(props: { label: string; value: string }) {
  return (
    <article className="rounded-3xl border border-[var(--color-line)] bg-white p-4">
      <p className="text-sm text-[var(--color-muted)]">{props.label}</p>
      <p className="mt-2 text-base font-semibold text-[var(--color-ink)]">{props.value}</p>
    </article>
  )
}
