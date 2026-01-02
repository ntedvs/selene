import AsyncStorage from "@react-native-async-storage/async-storage"
import { createClient } from "@supabase/supabase-js"

const url = "https://nromlepzwmqrwpvgmxob.supabase.co"
const key = "sb_publishable_4xOcv2bnXqwJAGRp5-lwRg_IUHuZL32"

export const supabase = createClient(url, key, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
  },
})
