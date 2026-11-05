import { Link } from "expo-router";
import { Text } from "react-native";
import "../../global.css";

import { useCssElement } from "react-native-css";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

export const SafeAreaView = (
  props: React.ComponentProps<typeof RNSafeAreaView> & { className?: string },
) => useCssElement(RNSafeAreaView, props, { className: "style" });

export default function App() {
  return (
    <SafeAreaView className="flex-1 bg-background p-5">
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
        href="/auth/sign-in"
        className="mt-4 rounded bg-primary text-white p-4"
      >
        go to sign in
      </Link>
      <Link
        href="/auth/sign-up"
        className="mt-4 rounded bg-primary text-white p-4"
      >
        go to sign up
      </Link>
      <Link href="/(tabs)/subcriptions/sptify">Spotify Subscription</Link>
      <Link
        href={{
          pathname: "/subcriptions/[id]",
          params: { id: "claude" },
        }}
      >
        claude max subscription
      </Link>
    </SafeAreaView>
  );
}
