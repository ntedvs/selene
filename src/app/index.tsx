import { Text } from "react-native"
import { auth } from "~/hooks/auth"

export default function Index() {
  const session = auth()

  return (
    <>
      <Text>Index</Text>
      <Text>{session ? session.user.email : "No"}</Text>
    </>
  )
}
