import dayjs, { type Dayjs } from 'dayjs'
import { useEffect, useMemo, useState } from 'react'
import type { Exercise, WorkoutEntry } from '../db/schema'
import { getBodyPartLabel } from '../features/exercises/options'
import { listExercises } from '../features/exercises/service'
import {
  formatWorkoutDateWithWeekday,
  groupWorkoutEntriesByDate,
  joinWorkoutEntriesWithExercises,
} from '../features/workouts/selectors'
import { listWorkoutEntries } from '../features/workouts/service'

type JoinedEntry = ReturnType<typeof joinWorkoutEntriesWithExercises>[number]

type PeriodSummary = {
  recordCount: number
  trainedDays: number
  totalSets: number
  topBodyPart: string
}

type MonthCell = {
  date: string
  dayNumber: number
  inCurrentMonth: boolean
  trained: boolean
}

const weekdayLabels = ['一', '二', '三', '四', '五', '六', '日']
const monthLabels = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']

export function StatsPage() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [entries, setEntries] = useState<WorkoutEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeView, setActiveView] = useState<'history' | 'stats'>('stats')

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
          setError('统计数据加载失败，请稍后重试。')
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
  const groupedEntries = useMemo(() => groupWorkoutEntriesByDate(joinedEntries), [joinedEntries])

  const totalStats = useMemo(() => {
    const trainedDays = new Set(joinedEntries.map((entry) => entry.date)).size
    return { totalCount: joinedEntries.length, totalDays: trainedDays }
  }, [joinedEntries])

  const weeklySummary = useMemo(
    () => summarizePeriod(joinedEntries, startOfBusinessWeek(dayjs()), endOfBusinessWeek(dayjs())),
    [joinedEntries],
  )
  const monthlySummary = useMemo(
    () => summarizePeriod(joinedEntries, dayjs().startOf('month'), dayjs().endOf('month')),
    [joinedEntries],
  )
  const yearlySummary = useMemo(
    () => summarizePeriod(joinedEntries, dayjs().startOf('year'), dayjs().endOf('year')),
    [joinedEntries],
  )

  const weeklyDays = useMemo(() => {
    const start = startOfBusinessWeek(dayjs())
    return buildTrainingDays(joinedEntries, start, 7)
  }, [joinedEntries])

  const monthlyCells = useMemo(() => {
    const currentMonth = dayjs()
    const monthStart = currentMonth.startOf('month')
    const monthEnd = currentMonth.endOf('month')
    const gridStart = startOfBusinessWeek(monthStart)
    const gridEnd = endOfBusinessWeek(monthEnd)
    const trainingMap = buildEntryCountMap(joinedEntries)
    const cells: MonthCell[] = []
    let cursor = gridStart

    while (cursor.isBefore(gridEnd) || cursor.isSame(gridEnd, 'day')) {
      const isoDate = cursor.format('YYYY-MM-DD')

      cells.push({
        date: isoDate,
        dayNumber: cursor.date(),
        inCurrentMonth: cursor.month() === currentMonth.month(),
        trained: (trainingMap.get(isoDate) ?? 0) > 0,
      })

      cursor = cursor.add(1, 'day')
    }

    return cells
  }, [joinedEntries])

  const yearlyBars = useMemo(() => {
    const year = dayjs().year()
    const daySets = Array.from({ length: 12 }, () => new Set<string>())

    for (const entry of joinedEntries) {
      const date = dayjs(entry.date)
      if (date.year() === year) {
        daySets[date.month()]?.add(entry.date)
      }
    }

    const counts = daySets.map((days) => days.size)
    const maxValue = Math.max(...counts, 1)

    return counts.map((count, index) => ({
      label: monthLabels[index],
      count,
      heightPercent: `${Math.max((count / maxValue) * 100, count > 0 ? 14 : 6)}%`,
    }))
  }, [joinedEntries])

  return (
    <section className="space-y-4">
      <div className="rounded-[2rem] bg-white p-2 shadow-[0_18px_36px_rgba(24,33,38,0.08)]">
        <div className="grid grid-cols-2 gap-2">
          <ViewTab
            label="历史记录"
            isActive={activeView === 'history'}
            onClick={() => setActiveView('history')}
          />
          <ViewTab label="统计" isActive={activeView === 'stats'} onClick={() => setActiveView('stats')} />
        </div>
      </div>

      {error ? (
        <p className="rounded-2xl bg-[rgba(143,59,30,0.12)] px-4 py-3 text-sm text-[var(--color-brand-deep)]">
          {error}
        </p>
      ) : null}

      {isLoading ? (
        <section className="rounded-3xl border border-dashed border-[var(--color-line)] bg-white p-5">
          <p className="text-sm text-[var(--color-muted)]">
            {activeView === 'stats' ? '正在统计训练数据...' : '正在读取训练历史...'}
          </p>
        </section>
      ) : null}

      {!isLoading && activeView === 'history' ? (
        <HistoryView groupedEntries={groupedEntries} />
      ) : null}

      {!isLoading && activeView === 'stats' ? (
        <div className="space-y-4">
          <header className="rounded-[2rem] bg-[linear-gradient(180deg,#f7efe3_0%,#efdfca_100%)] p-5 text-center shadow-[0_20px_40px_rgba(143,59,30,0.08)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-brand-deep)]">Stats</p>
            <h2 className="mt-2 text-2xl font-bold text-[var(--color-ink)]">统计</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
              先看总训练量，再分别看周、月、年的训练分布。
            </p>
          </header>

          <div className="grid grid-cols-2 gap-3">
            <StatCard label="总次数" value={String(totalStats.totalCount)} />
            <StatCard label="总天数" value={String(totalStats.totalDays)} />
          </div>

          <section className="rounded-[1.7rem] border border-[var(--color-line)] bg-white p-5 shadow-[0_12px_28px_rgba(24,33,38,0.06)]">
            <div className="text-center">
              <h3 className="text-lg font-bold text-[var(--color-ink)]">周统计</h3>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                {startOfBusinessWeek(dayjs()).format('M/D')} - {endOfBusinessWeek(dayjs()).format('M/D')}
              </p>
            </div>

            <div className="mt-4 grid grid-cols-7 gap-2">
              {weeklyDays.map((day, index) => (
                <article
                  key={day.date}
                  className={[
                    'min-h-28 rounded-2xl border p-2 text-center',
                    day.entryCount > 0
                      ? 'border-[rgba(46,103,181,0.20)] bg-[rgba(46,103,181,0.10)]'
                      : 'border-[var(--color-line)] bg-[var(--color-card)]',
                  ].join(' ')}
                >
                  <p className="text-xs font-semibold text-[var(--color-muted)]">{weekdayLabels[index]}</p>
                  <p className="mt-1 text-base font-bold text-[var(--color-ink)]">{dayjs(day.date).format('D')}</p>
                  <div className="mt-2 space-y-1">
                    {day.bodyParts.length === 0 ? (
                      <p className="text-[10px] text-[var(--color-muted)]">未训练</p>
                    ) : (
                      <>
                        {day.bodyParts.slice(0, 3).map((bodyPart) => (
                          <div
                            key={`${day.date}-${bodyPart}`}
                            className="inline-flex whitespace-nowrap rounded-full bg-white px-1 py-1 text-[8px] font-medium leading-none text-[var(--color-brand-deep)]"
                          >
                            {bodyPart}
                          </div>
                        ))}
                        {day.bodyParts.length > 3 ? (
                          <details className="relative">
                            <summary className="mx-auto inline-flex list-none cursor-pointer items-center justify-center rounded-full bg-white px-2 py-1 text-[8px] font-medium leading-none text-[var(--color-brand-deep)] marker:hidden">
                              ...
                            </summary>
                            <div className="absolute left-1/2 top-full z-10 mt-1 w-24 -translate-x-1/2 rounded-xl border border-[var(--color-line)] bg-white p-2 text-left shadow-[0_12px_24px_rgba(24,33,38,0.12)]">
                              <div className="flex flex-wrap gap-1">
                                {day.bodyParts.map((bodyPart) => (
                                  <span
                                    key={`${day.date}-all-${bodyPart}`}
                                    className="inline-flex whitespace-nowrap rounded-full bg-[var(--color-card)] px-1.5 py-1 text-[8px] font-medium leading-none text-[var(--color-brand-deep)]"
                                  >
                                    {bodyPart}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </details>
                        ) : null}
                      </>
                    )}
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <MiniStat label="训练次数" value={String(weeklySummary.recordCount)} />
              <MiniStat label="训练天数" value={String(weeklySummary.trainedDays)} />
              <MiniStat label="总组数" value={String(weeklySummary.totalSets)} />
              <MiniStat label="主练部位" value={weeklySummary.topBodyPart} />
            </div>
          </section>

          <section className="rounded-[1.7rem] border border-[var(--color-line)] bg-white p-5 shadow-[0_12px_28px_rgba(24,33,38,0.06)]">
            <div className="text-center">
              <h3 className="text-lg font-bold text-[var(--color-ink)]">月统计</h3>
              <p className="mt-1 text-sm text-[var(--color-muted)]">{dayjs().format('YYYY年M月')}</p>
            </div>

            <div className="mt-4 grid grid-cols-7 gap-2 text-center text-xs font-semibold text-[var(--color-muted)]">
              {weekdayLabels.map((label) => (
                <div key={label}>{label}</div>
              ))}
            </div>

            <div className="mt-2 grid grid-cols-7 gap-2">
              {monthlyCells.map((cell) => (
                <div
                  key={cell.date}
                  title={`${cell.date} · ${cell.trained ? '已训练' : '未训练'}`}
                  className={[
                    'flex h-10 items-center justify-center rounded-xl text-xs font-medium transition',
                    getMonthCellTone(cell.trained),
                    cell.inCurrentMonth ? 'opacity-100' : 'opacity-35',
                  ].join(' ')}
                >
                  {cell.dayNumber}
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap justify-center gap-2 text-xs text-[var(--color-muted)]">
              <span className="inline-flex items-center gap-2 rounded-full bg-[var(--color-card)] px-3 py-1">
                <span className="h-3 w-3 rounded bg-slate-300" />
                未训练
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-[var(--color-card)] px-3 py-1">
                <span className="h-3 w-3 rounded bg-sky-400" />
                已训练
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <MiniStat label="训练次数" value={String(monthlySummary.recordCount)} />
              <MiniStat label="训练天数" value={String(monthlySummary.trainedDays)} />
              <MiniStat label="总组数" value={String(monthlySummary.totalSets)} />
              <MiniStat label="主练部位" value={monthlySummary.topBodyPart} />
            </div>
          </section>

          <section className="rounded-[1.7rem] border border-[var(--color-line)] bg-white p-5 shadow-[0_12px_28px_rgba(24,33,38,0.06)]">
            <div className="text-center">
              <h3 className="text-lg font-bold text-[var(--color-ink)]">年统计</h3>
              <p className="mt-1 text-sm text-[var(--color-muted)]">{dayjs().format('YYYY年')}</p>
            </div>

            <div className="mt-6 flex h-56 items-end justify-between gap-2 rounded-[1.5rem] bg-[var(--color-card)] px-3 pb-4 pt-6">
              {yearlyBars.map((bar) => (
                <div key={bar.label} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2">
                  <span className="text-[10px] font-semibold text-[var(--color-brand-deep)]">{bar.count}</span>
                  <div
                    className="w-full rounded-t-2xl bg-[linear-gradient(180deg,#5d9cec_0%,#d8693d_100%)]"
                    style={{ height: bar.heightPercent }}
                  />
                  <span className="whitespace-nowrap text-[9px] text-[var(--color-muted)]">{bar.label}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <MiniStat label="训练次数" value={String(yearlySummary.recordCount)} />
              <MiniStat label="训练天数" value={String(yearlySummary.trainedDays)} />
              <MiniStat label="总组数" value={String(yearlySummary.totalSets)} />
              <MiniStat label="主练部位" value={yearlySummary.topBodyPart} />
            </div>
          </section>
        </div>
      ) : null}
    </section>
  )
}

function HistoryView(props: { groupedEntries: ReturnType<typeof groupWorkoutEntriesByDate> }) {
  if (props.groupedEntries.length === 0) {
    return (
      <section className="rounded-3xl border border-dashed border-[var(--color-line)] bg-white p-5">
        <h3 className="text-base font-semibold text-[var(--color-ink)]">还没有历史记录</h3>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          先去“新增训练”录入一条动作、组数和重量，这里就会按时间从近到远列出来。
        </p>
      </section>
    )
  }

  return (
    <div className="space-y-4">
      {props.groupedEntries.map((group) => (
        <section
          key={group.date}
          className="rounded-[1.7rem] border border-[var(--color-line)] bg-white p-5 shadow-[0_12px_28px_rgba(24,33,38,0.06)]"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-[var(--color-ink)]">{formatWorkoutDateWithWeekday(group.date)}</h2>
              <p className="mt-1 text-sm text-[var(--color-muted)]">共 {group.entries.length} 条训练记录</p>
            </div>
            <span className="rounded-full bg-[rgba(216,105,61,0.12)] px-3 py-1 text-xs font-medium text-[var(--color-brand-deep)]">
              {dayjs(group.date).format('MM/DD')}
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {group.entries.map((entry) => (
              <article
                key={entry.id}
                className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-card)] p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-[var(--color-ink)]">
                      {entry.exercise?.name ?? '未知动作'}
                    </h3>
                    <p className="mt-1 text-sm text-[var(--color-muted)]">
                      {entry.exercise ? getBodyPartLabel(entry.exercise.bodyPart) : '动作已从库中删除'}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {entry.sets !== null ? <MetricChip label="组数" value={String(entry.sets)} /> : null}
                    {entry.weight !== null ? <MetricChip label="重量" value={`${entry.weight} kg`} /> : null}
                    {entry.reps !== null ? <MetricChip label="次数" value={String(entry.reps)} /> : null}
                  </div>
                </div>

                {entry.notes ? <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">{entry.notes}</p> : null}
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

function summarizePeriod(entries: JoinedEntry[], start: Dayjs, end: Dayjs): PeriodSummary {
  const inRange = entries.filter((entry) => {
    const date = dayjs(entry.date)
    return (date.isSame(start, 'day') || date.isAfter(start, 'day')) && (date.isSame(end, 'day') || date.isBefore(end, 'day'))
  })

  const trainedDays = new Set(inRange.map((entry) => entry.date)).size
  const totalSets = inRange.reduce((sum, entry) => sum + (entry.sets ?? 0), 0)
  const bodyPartCounter = new Map<string, number>()

  for (const entry of inRange) {
    const label = entry.exercise ? getBodyPartLabel(entry.exercise.bodyPart) : '未知'
    bodyPartCounter.set(label, (bodyPartCounter.get(label) ?? 0) + 1)
  }

  const topBodyPart = [...bodyPartCounter.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ?? '暂无数据'

  return {
    recordCount: inRange.length,
    trainedDays,
    totalSets,
    topBodyPart,
  }
}

function buildTrainingDays(entries: JoinedEntry[], start: Dayjs, length: number) {
  const grouped = buildDayMap(entries)
  return Array.from({ length }, (_, index) => {
    const date = start.add(index, 'day').format('YYYY-MM-DD')
    const dayData = grouped.get(date)

    return {
      date,
      bodyParts: dayData ? [...dayData.bodyParts] : [],
      entryCount: dayData?.entryCount ?? 0,
    }
  })
}

function buildDayMap(entries: JoinedEntry[]) {
  const grouped = new Map<string, { bodyParts: Set<string>; entryCount: number }>()

  for (const entry of entries) {
    const current = grouped.get(entry.date) ?? { bodyParts: new Set<string>(), entryCount: 0 }
    current.entryCount += 1
    current.bodyParts.add(entry.exercise ? getBodyPartLabel(entry.exercise.bodyPart) : '未知')
    grouped.set(entry.date, current)
  }

  return grouped
}

function buildEntryCountMap(entries: JoinedEntry[]) {
  const map = new Map<string, number>()

  for (const entry of entries) {
    map.set(entry.date, (map.get(entry.date) ?? 0) + 1)
  }

  return map
}

function startOfBusinessWeek(value: Dayjs) {
  const dayIndex = (value.day() + 6) % 7
  return value.startOf('day').subtract(dayIndex, 'day')
}

function endOfBusinessWeek(value: Dayjs) {
  return startOfBusinessWeek(value).add(6, 'day')
}

function getMonthCellTone(trained: boolean) {
  if (trained) {
    return 'bg-sky-400 text-white'
  }

  return 'bg-slate-300 text-slate-600'
}

function ViewTab(props: { label: string; isActive: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      className={[
        'rounded-[1.4rem] px-4 py-3 text-sm font-semibold transition',
        props.isActive
          ? 'bg-[var(--color-brand)] text-white shadow-[0_12px_24px_rgba(216,105,61,0.28)]'
          : 'bg-[var(--color-card)] text-[var(--color-ink)]',
      ].join(' ')}
    >
      {props.label}
    </button>
  )
}

function StatCard(props: { label: string; value: string }) {
  return (
    <article className="rounded-[1.7rem] border border-[var(--color-line)] bg-white p-5 text-center shadow-[0_12px_28px_rgba(24,33,38,0.06)]">
      <p className="text-sm text-[var(--color-muted)]">{props.label}</p>
      <p className="mt-2 text-3xl font-bold text-[var(--color-ink)]">{props.value}</p>
    </article>
  )
}

function MiniStat(props: { label: string; value: string }) {
  return (
    <article className="rounded-2xl bg-[var(--color-card)] px-4 py-4 text-center">
      <p className="text-xs text-[var(--color-muted)]">{props.label}</p>
      <p className="mt-2 text-base font-semibold text-[var(--color-ink)]">{props.value}</p>
    </article>
  )
}

function MetricChip(props: { label: string; value: string }) {
  return (
    <span className="rounded-full bg-white px-3 py-2 text-sm text-[var(--color-ink)] ring-1 ring-[var(--color-line)]">
      <span className="font-semibold">{props.label}</span>
      <span className="ml-2 text-[var(--color-muted)]">{props.value}</span>
    </span>
  )
}
