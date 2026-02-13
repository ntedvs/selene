import { Pressable, StyleSheet, Text, View } from "react-native"
import { useAuth } from "~/contexts/auth-context"
import { FLOW_OPTIONS, useDefaultFlow } from "~/lib/settings"
import { supabase } from "~/lib/supabase"

export default function ProfileScreen() {
  const { session } = useAuth()
  const [defaultFlow, setDefaultFlow] = useDefaultFlow()

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Profile</Text>
      <Text style={styles.email}>{session?.user.email}</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>

        <Text style={styles.settingLabel}>Default period flow</Text>
        <View style={styles.flowRow}>
          {FLOW_OPTIONS.map((opt) => (
            <Pressable
              key={opt.value}
              style={[
                styles.flowOption,
                defaultFlow === opt.value && styles.flowOptionActive,
              ]}
              onPress={() => setDefaultFlow(opt.value)}
            >
              <Text
                style={[
                  styles.flowOptionText,
                  defaultFlow === opt.value && styles.flowOptionTextActive,
                ]}
              >
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <Pressable
        style={({ pressed }) => [styles.signOut, pressed && { opacity: 0.7 }]}
        onPress={() => supabase.auth.signOut()}
      >
        <Text style={styles.signOutText}>Sign out</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 80,
    paddingHorizontal: 24,
  },
  heading: {
    color: "#111",
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 4,
  },
  email: {
    color: "#888",
    fontSize: 14,
    marginBottom: 32,
  },
  section: {
    borderTopColor: "#e5e5e5",
    borderTopWidth: 1,
    paddingTop: 16,
  },
  sectionTitle: {
    color: "#999",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 16,
  },
  settingLabel: {
    color: "#111",
    fontSize: 15,
    marginBottom: 10,
  },
  flowRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  flowOption: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  flowOptionActive: {
    backgroundColor: "#e11d48",
    borderColor: "#e11d48",
  },
  flowOptionText: {
    color: "#999",
    fontSize: 13,
    fontWeight: "500",
  },
  flowOptionTextActive: {
    color: "#fff",
  },
  signOut: {
    marginTop: "auto",
    marginBottom: 32,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
  },
  signOutText: {
    color: "#e11d48",
    fontSize: 16,
    fontWeight: "600",
  },
})
