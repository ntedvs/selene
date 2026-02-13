import { useEffect, useRef, useState } from "react"
import {
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native"
import type { Log } from "~/lib/logs"

type Option = { value: string; label: string }
type LogType = {
  type: string
  label: string
  options: Option[]
}

const LOG_TYPES: LogType[] = [
  {
    type: "period",
    label: "Period flow",
    options: [
      { value: "extra light", label: "XL" },
      { value: "light", label: "L" },
      { value: "medium", label: "M" },
      { value: "heavy", label: "H" },
      { value: "extra heavy", label: "XH" },
    ],
  },
  {
    type: "cramps",
    label: "Cramps",
    options: [
      { value: "light", label: "L" },
      { value: "medium", label: "M" },
      { value: "heavy", label: "H" },
    ],
  },
  {
    type: "sex",
    label: "Sex",
    options: [
      { value: "protected", label: "Protected" },
      { value: "unprotected", label: "Unprotected" },
    ],
  },
]

const SCREEN_HEIGHT = Dimensions.get("window").height
const DISMISS_THRESHOLD = 100

type Props = {
  date: string
  logs: Log[]
  onToggle: (type: string, value: string) => void
  onClose: () => void
}

export function DaySheet({ date, logs, onToggle, onClose }: Props) {
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current
  const backdropOpacity = useRef(new Animated.Value(0)).current

  const [local, setLocal] = useState<Record<string, string | null>>(() => {
    const map: Record<string, string | null> = {}
    for (const lt of LOG_TYPES) {
      map[lt.type] = logs.find((l) => l.type === lt.type)?.value ?? null
    }
    return map
  })

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(onClose)
  }

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) translateY.setValue(g.dy)
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > DISMISS_THRESHOLD || g.vy > 0.5) {
          dismiss()
        } else {
          Animated.timing(translateY, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }).start()
        }
      },
    }),
  ).current

  const handlePress = (type: string, value: string) => {
    setLocal((prev) => ({
      ...prev,
      [type]: prev[type] === value ? null : value,
    }))
    onToggle(type, value)
  }

  const label = new Date(date + "T00:00:00").toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  })

  return (
    <Modal visible transparent statusBarTranslucent onRequestClose={dismiss}>
      <View style={styles.wrapper}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={dismiss} />
        </Animated.View>
        <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
          <View {...panResponder.panHandlers} style={styles.handle}>
            <View style={styles.handleBar} />
          </View>
          <Text style={styles.title}>{label}</Text>
          {LOG_TYPES.map((lt) => {
            const current = local[lt.type]
            return (
              <View key={lt.type} style={styles.section}>
                <Text style={styles.sectionLabel}>{lt.label}</Text>
                <View style={styles.segmented}>
                  {lt.options.map((opt, idx) => {
                    const selected = current === opt.value
                    return (
                      <Pressable
                        key={opt.value}
                        style={[
                          styles.segment,
                          selected && styles.segmentSelected,
                          idx === 0 && styles.segmentFirst,
                        ]}
                        onPress={() => handlePress(lt.type, opt.value)}
                      >
                        <Text
                          style={[
                            styles.segmentText,
                            selected && styles.segmentTextSelected,
                          ]}
                        >
                          {opt.label}
                        </Text>
                      </Pressable>
                    )
                  })}
                </View>
              </View>
            )
          })}
        </Animated.View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  sheet: {
    backgroundColor: "#f5f5f5",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  handle: {
    alignItems: "center",
    paddingTop: 24,
    paddingBottom: 24,
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#ccc",
  },
  title: {
    color: "#111",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 24,
  },
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    color: "#888",
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  segmented: {
    flexDirection: "row",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    overflow: "hidden",
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderLeftWidth: 1,
    borderLeftColor: "#ddd",
  },
  segmentFirst: {
    borderLeftWidth: 0,
  },
  segmentSelected: {
    backgroundColor: "#e11d48",
  },
  segmentText: {
    color: "#999",
    fontSize: 14,
    fontWeight: "500",
  },
  segmentTextSelected: {
    color: "#fff",
    fontWeight: "700",
  },
})
