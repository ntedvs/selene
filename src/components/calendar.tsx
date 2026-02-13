import { FlashList } from "@shopify/flash-list"
import { Plus } from "lucide-react-native"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Dimensions, Pressable, StyleSheet, View } from "react-native"
import { Gesture, GestureDetector } from "react-native-gesture-handler"
import { DaySheet } from "~/components/day-sheet"
import { MonthGrid } from "~/components/month-grid"
import { formatDate } from "~/lib/dates"
import { useAuth } from "~/contexts/auth-context"
import {
  deleteLog,
  fetchAllPeriodLogs,
  fetchLogs,
  type Log,
  upsertLog,
} from "~/lib/logs"
import { computePredictions, predictionDateSet } from "~/lib/predictions"
import { useDefaultFlow } from "~/lib/settings"

type MonthItem = { year: number; month: number; key: string }

function makeKey(year: number, month: number) {
  return `${year}-${month}`
}

function generateMonths(
  startYear: number,
  startMonth: number,
  count: number,
): MonthItem[] {
  const items: MonthItem[] = []
  let y = startYear
  let m = startMonth
  for (let i = 0; i < count; i++) {
    items.push({ year: y, month: m, key: makeKey(y, m) })
    m++
    if (m > 11) {
      m = 0
      y++
    }
  }
  return items
}

function monthsBefore(year: number, month: number, count: number): MonthItem[] {
  const items: MonthItem[] = []
  let y = year
  let m = month
  for (let i = 0; i < count; i++) {
    m--
    if (m < 0) {
      m = 11
      y--
    }
    items.unshift({ year: y, month: m, key: makeKey(y, m) })
  }
  return items
}

const PAST_MONTHS = 6
const FUTURE_MONTHS = 6
const LOAD_BATCH = 6
const CELL_SIZE = (Dimensions.get("window").width - 24) / 7
// Gap between bottom of one month's day grid and top of the next month's day grid
// = paddingBottom(16) + paddingTop(16) + header(18+12) + weekRow(CELL_SIZE+4)
const GRID_GAP = 16 + 16 + 30 + CELL_SIZE + 4

// Date constructor handles month overflow (-1 → Dec prev year, 12 → Jan next year)
function getMonthInfo(year: number, month: number) {
  const d = new Date(year, month, 1)
  const y = d.getFullYear()
  const m = d.getMonth()
  const firstDay = d.getDay()
  const days = new Date(y, m + 1, 0).getDate()
  const rows = Math.ceil((firstDay + days) / 7)
  return { year: y, month: m, firstDay, days, rows }
}

function dateFromGrid(
  anchorDate: string,
  startX: number,
  startY: number,
  currentX: number,
  currentY: number,
): string | null {
  const anchor = new Date(anchorDate + "T00:00:00")
  const aYear = anchor.getFullYear()
  const aMonth = anchor.getMonth()
  const aDay = anchor.getDate()

  const curr = getMonthInfo(aYear, aMonth)
  const anchorCol = (curr.firstDay + aDay - 1) % 7
  const anchorRow = Math.floor((curr.firstDay + aDay - 1) / 7)

  const gridLeft = startX - (anchorCol + 0.5) * CELL_SIZE
  const anchorGridTop = startY - (anchorRow + 0.5) * CELL_SIZE

  const prev = getMonthInfo(aYear, aMonth - 1)
  const next = getMonthInfo(aYear, aMonth + 1)

  const monthInfos = [
    { ...prev, top: anchorGridTop - GRID_GAP - prev.rows * CELL_SIZE },
    { ...curr, top: anchorGridTop },
    { ...next, top: anchorGridTop + curr.rows * CELL_SIZE + GRID_GAP },
  ]

  const col = Math.floor((currentX - gridLeft) / CELL_SIZE)
  if (col < 0 || col > 6) return null

  for (const m of monthInfos) {
    const bottom = m.top + m.rows * CELL_SIZE
    if (currentY >= m.top && currentY < bottom) {
      const row = Math.floor((currentY - m.top) / CELL_SIZE)
      const dayIndex = row * 7 + col - m.firstDay + 1
      if (dayIndex < 1 || dayIndex > m.days) return null
      return formatDate(m.year, m.month, dayIndex)
    }
  }
  return null
}

function dateRange(months: MonthItem[]) {
  const first = months[0]
  const last = months[months.length - 1]
  const start = formatDate(first.year, first.month, 1)
  const end = formatDate(last.year, last.month, new Date(last.year, last.month + 1, 0).getDate())
  return { start, end }
}

function datesBetween(a: string, b: string): string[] {
  const dates: string[] = []
  const start = a < b ? a : b
  const end = a < b ? b : a
  let cursor = new Date(start + "T00:00:00")
  const endDate = new Date(end + "T00:00:00")
  while (cursor <= endDate) {
    dates.push(cursor.toISOString().slice(0, 10))
    cursor.setDate(cursor.getDate() + 1)
  }
  return dates
}

export function Calendar() {
  const { session } = useAuth()
  const userId = session!.user.id
  const [defaultFlow] = useDefaultFlow()

  const today = useMemo(() => {
    const d = new Date()
    return formatDate(d.getFullYear(), d.getMonth(), d.getDate())
  }, [])

  const [months, setMonths] = useState<MonthItem[]>(() => {
    const now = new Date()
    const past = monthsBefore(now.getFullYear(), now.getMonth(), PAST_MONTHS)
    const future = generateMonths(
      now.getFullYear(),
      now.getMonth(),
      FUTURE_MONTHS + 1,
    )
    return [...past, ...future]
  })

  const [logs, setLogs] = useState<Record<string, Log[]>>({})
  const [predictedDates, setPredictedDates] = useState<Set<string>>(new Set())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [dragSelection, setDragSelection] = useState<Set<string> | null>(null)
  const dragRef = useRef({
    anchor: null as string | null,
    startX: 0,
    startY: 0,
    lastEnd: null as string | null,
    selection: null as Set<string> | null,
    mode: "add" as "add" | "remove",
  })
  const logsRef = useRef(logs)
  logsRef.current = logs

  useEffect(() => {
    const { start, end } = dateRange(months)
    fetchLogs(userId, start, end).then((data) =>
      setLogs((prev) => ({ ...prev, ...data })),
    )
  }, [months, userId])

  // Recompute predictions when logs change
  useEffect(() => {
    fetchAllPeriodLogs(userId).then((periodLogs) => {
      const result = computePredictions(periodLogs)
      if (result) {
        setPredictedDates(predictionDateSet(result.predictions))
      } else {
        setPredictedDates(new Set())
      }
    })
  }, [logs, userId])

  const handleEndReached = useCallback(() => {
    setMonths((prev) => {
      const last = prev[prev.length - 1]
      let y = last.year
      let m = last.month + 1
      if (m > 11) {
        m = 0
        y++
      }
      return [...prev, ...generateMonths(y, m, LOAD_BATCH)]
    })
  }, [])

  const handleStartReached = useCallback(() => {
    setMonths((prev) => {
      const first = prev[0]
      return [...monthsBefore(first.year, first.month, LOAD_BATCH), ...prev]
    })
  }, [])

  const handleDayPress = useCallback((date: string) => {
    setSelectedDate(date)
  }, [])

  const handleDayPressIn = useCallback((date: string) => {
    dragRef.current.anchor = date
  }, [])

  const handleToggle = useCallback(
    (type: string, value: string) => {
      if (!selectedDate) return
      setLogs((prev) => {
        const current = prev[selectedDate]?.find((l) => l.type === type)
        if (current?.value === value) {
          deleteLog(userId, selectedDate, type)
          return {
            ...prev,
            [selectedDate]: (prev[selectedDate] ?? []).filter(
              (l) => l.type !== type,
            ),
          }
        }
        upsertLog(userId, selectedDate, type, value)
        return {
          ...prev,
          [selectedDate]: [
            ...(prev[selectedDate] ?? []).filter((l) => l.type !== type),
            { id: "", date: selectedDate, type, value },
          ],
        }
      })
    },
    [selectedDate, userId],
  )

  const drag = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-10, 10])
        .failOffsetY([-20, 20])
        .onBegin((e) => {
          dragRef.current.startX = e.absoluteX
          dragRef.current.startY = e.absoluteY
        })
        .onStart(() => {
          const dr = dragRef.current
          if (!dr.anchor) return
          const anchorLogs = logsRef.current[dr.anchor] ?? []
          dr.mode = anchorLogs.some((l) => l.type === "period")
            ? "remove"
            : "add"
          dr.lastEnd = dr.anchor
          const sel = new Set([dr.anchor])
          dr.selection = sel
          setDragSelection(sel)
        })
        .onUpdate((e) => {
          const dr = dragRef.current
          if (!dr.anchor) return
          const endDate = dateFromGrid(
            dr.anchor,
            dr.startX,
            dr.startY,
            e.absoluteX,
            e.absoluteY,
          )
          if (endDate && endDate !== dr.lastEnd) {
            dr.lastEnd = endDate
            const range = datesBetween(dr.anchor, endDate)
            const sel = new Set(range)
            dr.selection = sel
            setDragSelection(sel)
          }
        })
        .onEnd(() => {
          const dr = dragRef.current
          if (!dr.anchor) return
          setDragSelection((sel) => {
            if (!sel || sel.size === 0) return sel
            if (sel.size === 1 && sel.has(dr.anchor!)) {
              setSelectedDate(dr.anchor)
              return sel
            }
            setLogs((prev) => {
              const next = { ...prev }
              for (const date of sel) {
                const existing = next[date] ?? []
                const hasPeriod = existing.some((l) => l.type === "period")
                if (dr.mode === "remove") {
                  if (hasPeriod) {
                    next[date] = existing.filter((l) => l.type !== "period")
                    deleteLog(userId, date, "period")
                  }
                } else if (!hasPeriod) {
                  next[date] = [
                    ...existing,
                    { id: "", date, type: "period", value: defaultFlow },
                  ]
                  upsertLog(userId, date, "period", defaultFlow)
                }
              }
              return next
            })
            return sel
          })
        })
        .onFinalize(() => {
          Object.assign(dragRef.current, {
            anchor: null,
            lastEnd: null,
            selection: null,
            mode: "add",
          })
          setDragSelection(null)
        }),
    [userId, defaultFlow],
  )

  const renderItem = useCallback(
    ({ item }: { item: MonthItem }) => {
      const daysInMonth = new Date(item.year, item.month + 1, 0).getDate()
      const monthLogs: Record<string, Log[]> = {}
      for (let d = 1; d <= daysInMonth; d++) {
        const key = formatDate(item.year, item.month, d)
        if (logs[key]?.length) monthLogs[key] = logs[key]
      }
      const sel = dragRef.current.selection
      const monthDragDates: string[] = []
      if (sel) {
        for (let d = 1; d <= daysInMonth; d++) {
          const key = formatDate(item.year, item.month, d)
          if (sel.has(key)) monthDragDates.push(key)
        }
      }
      return (
        <MonthGrid
          year={item.year}
          month={item.month}
          logs={monthLogs}
          predictions={predictedDates}
          dragSelection={monthDragDates}
          onDayPress={handleDayPress}
          onDayPressIn={handleDayPressIn}
        />
      )
    },
    [logs, predictedDates, dragSelection, handleDayPress, handleDayPressIn],
  )

  return (
    <GestureDetector gesture={drag}>
      <View style={styles.container}>
        <FlashList
          data={months}
          renderItem={renderItem}
          keyExtractor={(item) => item.key}
          initialScrollIndex={PAST_MONTHS}
          onEndReached={handleEndReached}
          onEndReachedThreshold={2}
          onStartReached={handleStartReached}
          onStartReachedThreshold={2}
          scrollEnabled={dragSelection === null}
        />
        <Pressable
          style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
          onPress={() => setSelectedDate(today)}
        >
          <Plus color="#fff" size={28} strokeWidth={2.25} />
        </Pressable>
        {selectedDate && (
          <DaySheet
            date={selectedDate}
            logs={logs[selectedDate] ?? []}
            onToggle={handleToggle}
            onClose={() => setSelectedDate(null)}
          />
        )}
      </View>
    </GestureDetector>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  fab: {
    position: "absolute",
    bottom: 32,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#e11d48",
    alignItems: "center",
    justifyContent: "center",
  },
  fabPressed: {
    opacity: 0.8,
  },
})
