import { Stack } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { AuthProvider, useAuth } from "~/contexts/auth-context"
import { FlowProvider } from "~/lib/settings"

export default function Layout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="dark" />

      <AuthProvider>
        <FlowProvider>
          <RootStack />
        </FlowProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  )
}

function RootStack() {
  const { session, loading } = useAuth()
  if (loading) return null

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!!session}>
        <Stack.Screen name="(tabs)" />
      </Stack.Protected>

      <Stack.Protected guard={!session}>
        <Stack.Screen name="auth" />
      </Stack.Protected>
    </Stack>
  )
}
