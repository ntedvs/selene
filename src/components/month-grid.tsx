import { memo, useMemo } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { formatDate } from "~/lib/dates"
import type { Log } from "~/lib/logs"

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]

type Props = {
  year: number
  month: number
  logs: Record<string, Log[]>
  predictions: Set<string>
  dragSelection: string[]
  onDayPress: (date: string) => void
  onDayPressIn: (date: string) => void
}

function MonthGridInner({
  year,
  month,
  logs,
  predictions,
  dragSelection,
  onDayPress,
  onDayPressIn,
}: Props) {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const today = new Date()
  const isCurrentMonth =
    today.getFullYear() === year && today.getMonth() === month
  const todayDate = today.getDate()

  const dragSet = useMemo(() => new Set(dragSelection), [dragSelection])

  const cells: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  return (
    <View style={styles.container}>
      <Text style={styles.header}>
        {MONTH_NAMES[month]} {year}
      </Text>

      <View style={styles.weekRow}>
        {DAYS.map((d) => (
          <View key={d} style={styles.cell}>
            <Text style={styles.weekDay}>{d}</Text>
          </View>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((day, i) => {
          if (day == null) {
            return <View key={i} style={styles.cell} />
          }
          const dateStr = formatDate(year, month, day)
          const dayLogs = logs[dateStr]
          const hasPeriod = dayLogs?.some((l) => l.type === "period")
          const hasCramps = dayLogs?.some((l) => l.type === "cramps")
          const hasSex = dayLogs?.some((l) => l.type === "sex")
          const isPredicted = !hasPeriod && predictions.has(dateStr)
          const isToday = isCurrentMonth && day === todayDate
          const isDragSelected = dragSet.has(dateStr)

          return (
            <Pressable
              key={i}
              style={styles.cell}
              onPress={() => onDayPress(dateStr)}
              onPressIn={() => onDayPressIn(dateStr)}
            >
              <View
                style={[
                  styles.dayCircle,
                  isPredicted && styles.predictedCircle,
                  isToday && styles.todayCircle,
                  isDragSelected && styles.dragSelectedCircle,
                ]}
              >
                {hasPeriod && (
                  <View style={[styles.arcClip, styles.arcTL]}>
                    <View style={[styles.arcRing, styles.arcRingPeriod]} />
                  </View>
                )}
                {hasCramps && (
                  <View style={[styles.arcClip, styles.arcTR]}>
                    <View
                      style={[
                        styles.arcRing,
                        styles.arcRingCramps,
                        styles.arcRingOffsetTR,
                      ]}
                    />
                  </View>
                )}
                {hasSex && (
                  <View style={[styles.arcClip, styles.arcBR]}>
                    <View
                      style={[
                        styles.arcRing,
                        styles.arcRingSex,
                        styles.arcRingOffsetBR,
                      ]}
                    />
                  </View>
                )}
                <Text style={[styles.dayText, isToday && styles.todayText]}>
                  {day}
                </Text>
              </View>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

function dragSelectionsEqual(a: string[], b: string[]) {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false
  }
  return true
}

export const MonthGrid = memo(MonthGridInner, (prev, next) => {
  if (
    prev.year !== next.year ||
    prev.month !== next.month ||
    prev.onDayPress !== next.onDayPress ||
    prev.predictions !== next.predictions
  )
    return false
  if (!dragSelectionsEqual(prev.dragSelection, next.dragSelection)) return false
  const prevLogs = prev.logs
  const nextLogs = next.logs
  const keys = new Set([...Object.keys(prevLogs), ...Object.keys(nextLogs)])
  for (const k of keys) {
    if (prevLogs[k] !== nextLogs[k]) return false
  }
  return true
})

const CELL_SIZE = `${100 / 7}%` as const

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  header: {
    color: "#111",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  weekRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  cell: {
    width: CELL_SIZE,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  arcClip: {
    position: "absolute",
    width: 18,
    height: 18,
    overflow: "hidden",
  },
  arcTL: {
    top: 0,
    left: 0,
  },
  arcTR: {
    top: 0,
    right: 0,
  },
  arcBR: {
    bottom: 0,
    right: 0,
  },
  arcRing: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
  },
  arcRingPeriod: {
    borderColor: "#e11d48",
  },
  predictedCircle: {
    backgroundColor: "rgba(225, 29, 72, 0.15)",
  },
  arcRingCramps: {
    borderColor: "#f59e0b",
  },
  arcRingSex: {
    borderColor: "#8b5cf6",
  },
  arcRingOffsetTR: {
    position: "absolute",
    right: 0,
  },
  arcRingOffsetBR: {
    position: "absolute",
    right: 0,
    bottom: 0,
  },
  todayCircle: {
    backgroundColor: "#2563eb",
  },
  weekDay: {
    color: "#999",
    fontSize: 12,
    fontWeight: "500",
  },
  dayText: {
    color: "#111",
    fontSize: 15,
  },
  todayText: {
    color: "#fff",
    fontWeight: "700",
  },
  dragSelectedCircle: {
    backgroundColor: "rgba(225, 29, 72, 0.3)",
  },
})
