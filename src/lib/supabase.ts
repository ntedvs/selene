import AsyncStorage from "@react-native-async-storage/async-storage"
import { createClient } from "@supabase/supabase-js"
import { AppState } from "react-native"

const url = process.env.EXPO_PUBLIC_SUPABASE_URL!
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY!

export const supabase = createClient(url, key, {
  auth: {
    storage: AsyncStorage,
    detectSessionInUrl: false,
  },
})

AppState.addEventListener("change", (state) => {
  if (state === "active") {
    supabase.auth.startAutoRefresh()
  } else {
    supabase.auth.stopAutoRefresh()
  }
})
