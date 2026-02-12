export type CycleInfo = {
  startDate: string
  duration: number
  cycleLength?: number
}

export type Prediction = {
  startDate: string
  endDate: string
  confidence: "high" | "medium" | "low"
}

export type PredictionResult = {
  cycles: CycleInfo[]
  predictions: Prediction[]
  avgCycleLength: number
  stdDev: number
}

type LogEntry = { date: string; type: string; value: string | null }

const WEIGHTS = [0.3, 0.25, 0.2, 0.12, 0.08, 0.05]
const PREDICTION_COUNT = 6

function daysBetween(a: string, b: string): number {
  const msPerDay = 86400000
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / msPerDay)
}

function addDays(date: string, days: number): string {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

/** Group consecutive period-log dates into periods (gap of 2+ days = new period) */
export function extractCycles(logs: LogEntry[]): CycleInfo[] {
  const periodDates = logs
    .filter((l) => l.type === "period")
    .map((l) => l.date)
    .sort()

  if (periodDates.length === 0) return []

  // Group consecutive dates into periods
  const periods: { start: string; end: string }[] = []
  let start = periodDates[0]
  let prev = periodDates[0]

  for (let i = 1; i < periodDates.length; i++) {
    const gap = daysBetween(prev, periodDates[i])
    if (gap > 2) {
      periods.push({ start, end: prev })
      start = periodDates[i]
    }
    prev = periodDates[i]
  }
  periods.push({ start, end: prev })

  // Build cycle info
  const cycles: CycleInfo[] = periods.map((p, i) => ({
    startDate: p.start,
    duration: daysBetween(p.start, p.end) + 1,
    cycleLength:
      i < periods.length - 1
        ? daysBetween(p.start, periods[i + 1].start)
        : undefined,
  }))

  return cycles
}

function weightedAverage(lengths: number[]): number {
  const n = Math.min(lengths.length, WEIGHTS.length)
  const w = WEIGHTS.slice(0, n)
  const total = w.reduce((s, v) => s + v, 0)
  let sum = 0
  for (let i = 0; i < n; i++) {
    sum += w[i] * lengths[lengths.length - 1 - i]
  }
  return sum / total
}

function stdDev(lengths: number[]): number {
  if (lengths.length < 2) return 3 // default when not enough data
  const mean = lengths.reduce((s, v) => s + v, 0) / lengths.length
  const variance =
    lengths.reduce((s, v) => s + (v - mean) ** 2, 0) / (lengths.length - 1)
  return Math.sqrt(variance)
}

function confidence(numCycles: number, sd: number): "high" | "medium" | "low" {
  if (numCycles >= 6 && sd <= 3) return "high"
  if (numCycles >= 3 && sd <= 5) return "medium"
  return "low"
}

export function computePredictions(logs: LogEntry[]): PredictionResult | null {
  const cycles = extractCycles(logs)
  const completedCycles = cycles.filter((c) => c.cycleLength != null)

  // Need at least 2 completed cycles
  if (completedCycles.length < 2) return null

  const lengths = completedCycles.map((c) => c.cycleLength!)
  const avg = weightedAverage(lengths)
  const sd = stdDev(lengths)
  const avgDuration = Math.round(
    cycles.reduce((s, c) => s + c.duration, 0) / cycles.length,
  )
  const conf = confidence(completedCycles.length, sd)

  const lastCycle = cycles[cycles.length - 1]

  // Check for cramps in current cycle (after last period ended)
  const lastPeriodEnd = addDays(lastCycle.startDate, lastCycle.duration - 1)
  const crampDates = logs
    .filter((l) => l.type === "cramps" && l.date > lastPeriodEnd)
    .map((l) => l.date)
    .sort()

  let nextStart = addDays(lastCycle.startDate, Math.round(avg))

  // Cramps adjustment: if cramps logged, shift prediction earlier
  if (crampDates.length > 0) {
    const latestCramp = crampDates[crampDates.length - 1]
    const crampBasedStart = addDays(latestCramp, 2)
    if (crampBasedStart < nextStart) {
      nextStart = crampBasedStart
    }
  }

  const predictions: Prediction[] = []
  let cursor = nextStart

  for (let i = 0; i < PREDICTION_COUNT; i++) {
    const endDate = addDays(cursor, avgDuration - 1)
    predictions.push({
      startDate: cursor,
      endDate,
      confidence: i === 0 ? conf : "low",
    })
    cursor = addDays(cursor, Math.round(avg))
  }

  return {
    cycles,
    predictions,
    avgCycleLength: Math.round(avg * 10) / 10,
    stdDev: Math.round(sd * 10) / 10,
  }
}

/** Returns a Set of all predicted period date strings (YYYY-MM-DD) */
export function predictionDateSet(predictions: Prediction[]): Set<string> {
  const dates = new Set<string>()
  for (const p of predictions) {
    let d = p.startDate
    while (d <= p.endDate) {
      dates.add(d)
      d = addDays(d, 1)
    }
  }
  return dates
}
