export type WeightUnit = 'kg' | 'lb'
export type WeekStartsOn = 'monday' | 'sunday'

export type AppPreferences = {
  weightUnit: WeightUnit
  weekStartsOn: WeekStartsOn
}

const STORAGE_KEY = 'fitness-pwa-preferences'
export const PREFERENCES_UPDATED_EVENT = 'fitness-pwa-preferences-updated'

const defaultPreferences: AppPreferences = {
  weightUnit: 'kg',
  weekStartsOn: 'monday',
}

export function getAppPreferences(): AppPreferences {
  if (typeof window === 'undefined') {
    return defaultPreferences
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)

    if (!raw) {
      return defaultPreferences
    }

    const parsed = JSON.parse(raw) as Partial<AppPreferences>

    return {
      weightUnit: parsed.weightUnit === 'lb' ? 'lb' : defaultPreferences.weightUnit,
      weekStartsOn: parsed.weekStartsOn === 'sunday' ? 'sunday' : defaultPreferences.weekStartsOn,
    }
  } catch {
    return defaultPreferences
  }
}

export function saveAppPreferences(nextPreferences: Partial<AppPreferences>) {
  if (typeof window === 'undefined') {
    return defaultPreferences
  }

  const merged = {
    ...getAppPreferences(),
    ...nextPreferences,
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
  window.dispatchEvent(new CustomEvent(PREFERENCES_UPDATED_EVENT, { detail: merged }))

  return merged
}

export function getWeightUnitLabel(unit: WeightUnit) {
  return unit === 'lb' ? 'lb' : 'kg'
}

export function formatWeight(value: number, unit: WeightUnit) {
  return `${value} ${getWeightUnitLabel(unit)}`
}

export function getWeekStartsOnLabel(value: WeekStartsOn) {
  return value === 'sunday' ? '周日' : '周一'
}
