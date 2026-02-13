import { useEffect, useRef, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
} from "react-native"
import { supabase } from "~/lib/supabase"

export default function Auth() {
  const [mode, setMode] = useState<"login" | "signup">("signup")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const offset = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const show = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow"
    const hide = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide"

    function animateTo(toValue: number, duration: number) {
      Animated.timing(offset, {
        toValue,
        duration,
        easing: Easing.bezier(0.38, 0.7, 0.2, 1),
        useNativeDriver: true,
      }).start()
    }

    const onShow = Keyboard.addListener(show, (e) =>
      animateTo(-(e.endCoordinates.height / 3), e.duration ?? 250),
    )
    const onHide = Keyboard.addListener(hide, (e) =>
      animateTo(0, e.duration ?? 250),
    )

    return () => {
      onShow.remove()
      onHide.remove()
    }
  }, [])

  const isLogin = mode === "login"

  async function handleSubmit() {
    setLoading(true)
    const { error } = isLogin
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password })
    setLoading(false)
    if (error) Alert.alert("Error", error.message)
  }

  return (
    <Animated.View
      style={[styles.container, { transform: [{ translateY: offset }] }]}
    >
      <Text style={styles.title}>{isLogin ? "Log in" : "Sign up"}</Text>

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
        autoComplete={isLogin ? "current-password" : "new-password"}
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
            {isLogin ? "Log in" : "Sign up"}
          </Text>
        )}
      </Pressable>

      <Pressable
        onPress={() => setMode(isLogin ? "signup" : "login")}
        style={styles.toggle}
      >
        <Text style={styles.toggleText}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <Text style={styles.toggleAction}>
            {isLogin ? "Sign up" : "Log in"}
          </Text>
        </Text>
      </Pressable>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    paddingBottom: 200,
    marginBottom: -200,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111",
    marginBottom: 32,
    textAlign: "center",
  },
  input: {
    backgroundColor: "#f5f5f5",
    color: "#111",
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#ddd",
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
