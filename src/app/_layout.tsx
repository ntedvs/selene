import { Stack } from "expo-router"
import { AuthProvider, useAuth } from "~/contexts/auth-context"

export default function Layout() {
  return (
    <AuthProvider>
      <RootStack />
    </AuthProvider>
  )
}

function RootStack() {
  const { session, loading } = useAuth()
  if (loading) return null

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!!session}>
        <Stack.Screen name="index" />
      </Stack.Protected>

      <Stack.Protected guard={!session}>
        <Stack.Screen name="auth" />
      </Stack.Protected>
    </Stack>
  )
}
