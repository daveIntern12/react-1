import { Link } from "expo-router";
import { Text, View } from "react-native";
import "../../global.css";
export default function App() {
  return (
    <View className="flex-1 items-center justify-center bg-background">
      <Text className="text-xl font-bold text-success">
        Welcome to Nativewind!
      </Text>
      <Link
        href="/onboarding"
        className="mt-4 rounded bg-primary text-white p-4"
      >
        go to onboarding
      </Link>
      <Link
        href="/(auth)/sign-in"
        className="mt-4 rounded bg-primary text-white p-4"
      >
        go to sign in
      </Link>
      <Link
        href="/(auth)/sign-up"
        className="mt-4 rounded bg-primary text-white p-4"
      >
        go to sign up
      </Link>
      <Link href="/subcriptions/spotify">Spotify Subscription</Link>
      <Link
        href={{
          pathname: "/subcriptions/[id]",
          params: { id: "claude" },
        }}
      >
        claude max subscription
      </Link>
    </View>
  );
}
