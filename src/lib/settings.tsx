import AsyncStorage from "@react-native-async-storage/async-storage"
import { createContext, useContext, useEffect, useState } from "react"

const KEY = "default_flow"
const DEFAULT = "medium"

export const FLOW_OPTIONS = [
  { value: "extra light", label: "Extra light" },
  { value: "light", label: "Light" },
  { value: "medium", label: "Medium" },
  { value: "heavy", label: "Heavy" },
  { value: "extra heavy", label: "Extra heavy" },
] as const

const FlowContext = createContext<{
  flow: string
  setFlow: (v: string) => void
}>({ flow: DEFAULT, setFlow: () => {} })

export function FlowProvider({ children }: { children: React.ReactNode }) {
  const [flow, setFlowState] = useState(DEFAULT)

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((v) => {
      if (v) setFlowState(v)
    })
  }, [])

  function setFlow(value: string) {
    setFlowState(value)
    AsyncStorage.setItem(KEY, value)
  }

  return (
    <FlowContext.Provider value={{ flow, setFlow }}>
      {children}
    </FlowContext.Provider>
  )
}

export function useDefaultFlow() {
  const { flow, setFlow } = useContext(FlowContext)
  return [flow, setFlow] as const
}
