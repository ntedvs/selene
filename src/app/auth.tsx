import { useState } from "react"
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native"
import { supabase } from "~/lib/supabase"

export default function Auth() {
  const [mode, setMode] = useState<"login" | "signup">("signup")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    setLoading(true)
    const { error } =
      mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password })
    setLoading(false)
    if (error) Alert.alert("Error", error.message)
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {mode === "login" ? "Log in" : "Sign up"}
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#888"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#888"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete={mode === "login" ? "current-password" : "new-password"}
      />

      <Pressable
        style={({ pressed }) => [
          styles.button,
          pressed && styles.buttonPressed,
        ]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>
            {mode === "login" ? "Log in" : "Sign up"}
          </Text>
        )}
      </Pressable>

      <Pressable
        onPress={() => setMode(mode === "login" ? "signup" : "login")}
        style={styles.toggle}
      >
        <Text style={styles.toggleText}>
          {mode === "login"
            ? "Don't have an account? "
            : "Already have an account? "}
          <Text style={styles.toggleAction}>
            {mode === "login" ? "Sign up" : "Log in"}
          </Text>
        </Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#000",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 32,
    textAlign: "center",
  },
  input: {
    backgroundColor: "#1a1a1a",
    color: "#fff",
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#333",
  },
  button: {
    backgroundColor: "#2563eb",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
    marginTop: 8,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  toggle: {
    marginTop: 24,
    alignItems: "center",
  },
  toggleText: {
    color: "#888",
    fontSize: 14,
  },
  toggleAction: {
    color: "#2563eb",
    fontWeight: "600",
  },
})
