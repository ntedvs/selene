import { useState } from "react"
import { Alert, Pressable, Text, TextInput } from "react-native"
import { supabase } from "~/lib/supabase"

// // Tells Supabase Auth to continuously refresh the session automatically if
// // the app is in the foreground. When this is added, you will continue to receive
// // `onAuthStateChange` events with the `TOKEN_REFRESHED` or `SIGNED_OUT` event
// // if the user's session is terminated. This should only be registered once.
// AppState.addEventListener("change", (state) => {
//   if (state === "active") {
//     supabase.auth.startAutoRefresh()
//   } else {
//     supabase.auth.stopAutoRefresh()
//   }
// })

export default function Auth() {
  const [creating, setCreating] = useState(true)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const signUp = async () => {
    setLoading(true)

    const { error } = await supabase.auth.signUp({ email, password })
    if (error) Alert.alert(error.message)

    setLoading(false)
  }

  const logIn = async () => {
    setLoading(true)

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (!data.session) Alert.alert("Check your inbox for verification")
    if (error) Alert.alert(error.message)

    setLoading(false)
  }

  return (
    <>
      <TextInput
        value={email}
        onChangeText={setEmail}
        style={{
          borderColor: "red",
          borderStyle: "solid",
          borderWidth: 10,
          marginTop: 80,
        }}
      />

      <TextInput
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{
          borderColor: "red",
          borderStyle: "solid",
          borderWidth: 10,
          marginTop: 80,
        }}
      />

      <Pressable onPress={creating ? signUp : logIn} disabled={loading}>
        <Text>{creating ? "Sign Up" : "Log In"}</Text>
      </Pressable>

      <Pressable onPress={() => setCreating(!creating)}>
        <Text>
          {creating ? "Already have an account? " : "Don't have an account? "}

          <Text style={{ color: "blue" }}>
            {creating ? "Log in" : "Sign up"}
          </Text>
        </Text>
      </Pressable>
    </>
  )
}
