import { Stack, Tabs } from "expo-router"
import { Home, User } from "lucide-react-native"
import { Text } from "react-native"
import { auth } from "~/hooks/auth"

export default function Layout() {
  const session = auth()

  if (session) {
    return (
      <Stack>
        <Text>Hey</Text>
      </Stack>
    )
  }

  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="index"
        options={{ title: "Home", tabBarIcon: () => <Home /> }}
      />

      <Tabs.Screen
        name="profile"
        options={{ title: "Profile", tabBarIcon: () => <User /> }}
      />
    </Tabs>
  )
}
