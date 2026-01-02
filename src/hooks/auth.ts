import { Session } from "@supabase/supabase-js"
import { useEffect, useState } from "react"
import { supabase } from "~/lib/supabase"

export const auth = () => {
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    supabase.auth.onAuthStateChange((event, session) => {
      setSession(session)
    })
  }, [])

  return session
}
