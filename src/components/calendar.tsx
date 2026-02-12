import { FlashList } from "@shopify/flash-list"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { DaySheet } from "~/components/day-sheet"
import { MonthGrid } from "~/components/month-grid"
import { useAuth } from "~/contexts/auth-context"
import {
  deleteLog,
  fetchAllPeriodLogs,
  fetchLogs,
  type Log,
  upsertLog,
} from "~/lib/logs"
import { computePredictions, predictionDateSet } from "~/lib/predictions"

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

function dateRange(months: MonthItem[]) {
  const first = months[0]
  const last = months[months.length - 1]
  const start = `${first.year}-${String(first.month + 1).padStart(2, "0")}-01`
  const lastDay = new Date(last.year, last.month + 1, 0).getDate()
  const end = `${last.year}-${String(last.month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`
  return { start, end }
}

export function Calendar() {
  const { session } = useAuth()
  const userId = session!.user.id

  const today = useMemo(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
  }, [])

  const now = new Date()
  const [months, setMonths] = useState<MonthItem[]>(() => {
    const past = monthsBefore(now.getFullYear(), now.getMonth(), PAST_MONTHS)
    const futureStart = new Date(now.getFullYear(), now.getMonth())
    const future = generateMonths(
      futureStart.getFullYear(),
      futureStart.getMonth(),
      FUTURE_MONTHS + 1,
    )
    return [...past, ...future]
  })

  const [logs, setLogs] = useState<Record<string, Log[]>>({})
  const [predictedDates, setPredictedDates] = useState<Set<string>>(new Set())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const loadingRef = useRef(false)

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
    if (loadingRef.current) return
    loadingRef.current = true
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
    loadingRef.current = false
  }, [])

  const handleStartReached = useCallback(() => {
    if (loadingRef.current) return
    loadingRef.current = true
    setMonths((prev) => {
      const first = prev[0]
      return [...monthsBefore(first.year, first.month, LOAD_BATCH), ...prev]
    })
    loadingRef.current = false
  }, [])

  const handleDayPress = useCallback((date: string) => {
    setSelectedDate(date)
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

  const renderItem = useCallback(
    ({ item }: { item: MonthItem }) => {
      const daysInMonth = new Date(item.year, item.month + 1, 0).getDate()
      const monthLogs: Record<string, Log[]> = {}
      for (let d = 1; d <= daysInMonth; d++) {
        const key = `${item.year}-${String(item.month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`
        if (logs[key]?.length) monthLogs[key] = logs[key]
      }
      return (
        <MonthGrid
          year={item.year}
          month={item.month}
          logs={monthLogs}
          predictions={predictedDates}
          onDayPress={handleDayPress}
        />
      )
    },
    [logs, predictedDates, handleDayPress],
  )

  return (
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
      />
      <Pressable
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
        onPress={() => setSelectedDate(today)}
      >
        <Text style={styles.fabText}>+</Text>
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
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
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
  fabText: {
    color: "#fff",
    fontSize: 28,
    lineHeight: 28,
    fontWeight: "300",
  },
})
