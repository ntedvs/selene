import { supabase } from "~/lib/supabase"

export type Log = {
  id: string
  date: string
  type: string
  value: string | null
}

export async function fetchLogs(
  userId: string,
  startDate: string,
  endDate: string,
): Promise<Record<string, Log[]>> {
  const { data, error } = await supabase
    .from("logs")
    .select("id, date, type, value")
    .eq("user_id", userId)
    .gte("date", startDate)
    .lte("date", endDate)

  if (error) throw error

  const grouped: Record<string, Log[]> = {}
  for (const row of data ?? []) {
    const key = row.date
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(row)
  }
  return grouped
}

export async function upsertLog(
  userId: string,
  date: string,
  type: string,
  value: string,
) {
  const { error } = await supabase
    .from("logs")
    .upsert(
      { user_id: userId, date, type, value },
      { onConflict: "user_id,date,type" },
    )

  if (error) throw error
}

export async function fetchAllPeriodLogs(
  userId: string,
): Promise<{ date: string; type: string; value: string | null }[]> {
  const { data, error } = await supabase
    .from("logs")
    .select("date, type, value")
    .eq("user_id", userId)
    .in("type", ["period", "cramps"])

  if (error) throw error
  return data ?? []
}

export async function deleteLog(userId: string, date: string, type: string) {
  const { error } = await supabase
    .from("logs")
    .delete()
    .eq("user_id", userId)
    .eq("date", date)
    .eq("type", type)

  if (error) throw error
}
