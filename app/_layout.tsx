import { ClerkProvider, useUser } from "@clerk/expo";
import { useFonts } from "expo-font";
import { SplashScreen, Stack } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { PostHogProvider, usePostHog } from "posthog-react-native";
import { useEffect, useRef } from "react";
import { Text, View } from "react-native";
import { posthog } from "../lib/posthog";
import "../global.css";

SplashScreen.preventAutoHideAsync();

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

const tokenCache = {
  async getToken(key: string) {
    return SecureStore.getItemAsync(key);
  },
  async saveToken(key: string, token: string) {
    return SecureStore.setItemAsync(key, token);
  },
};

function PostHogIdentity() {
  const posthogClient = usePostHog();
  const { isLoaded, isSignedIn, user } = useUser();
  const identifiedUserId = useRef<string | null>(null);
  const hasResolvedAuth = useRef(false);

  useEffect(() => {
    if (!isLoaded) return;

    if (isSignedIn && user) {
      if (identifiedUserId.current !== user.id) {
        posthogClient.identify(user.id, {
          $set: {
            email: user.primaryEmailAddress?.emailAddress ?? null,
            first_name: user.firstName,
            last_name: user.lastName,
          },
        });
        identifiedUserId.current = user.id;
      }
    } else if (!hasResolvedAuth.current || identifiedUserId.current) {
      posthogClient.reset();
      identifiedUserId.current = null;
    }

    hasResolvedAuth.current = true;
  }, [isLoaded, isSignedIn, posthogClient, user]);

  return null;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    "sans-regular": require("../assets/fonts/PlusJakartaSans-Regular.ttf"),
    "sans-bold": require("../assets/fonts/PlusJakartaSans-Bold.ttf"),
    "sans-medium": require("../assets/fonts/PlusJakartaSans-Medium.ttf"),
    "sans-semibold": require("../assets/fonts/PlusJakartaSans-SemiBold.ttf"),
    "sans-extrabold": require("../assets/fonts/PlusJakartaSans-ExtraBold.ttf"),
    "sans-light": require("../assets/fonts/PlusJakartaSans-Light.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  if (!publishableKey) {
    return (
      <View className="flex-1 items-center justify-center bg-background p-8">
        <Text className="text-center font-sans-bold text-primary">
          Add EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY to your .env file to enable
          authentication.
        </Text>
      </View>
    );
  }

  return (
    <ClerkProvider
      publishableKey="pk_test_YWN0aXZlLWhvdW5kLTg3MjcuY2xlcmsuYWNjb3VudHMuZGV2JA"
      tokenCache={tokenCache}
    >
      {posthog ? (
        <PostHogProvider client={posthog}>
          <PostHogIdentity />
          <Stack screenOptions={{ headerShown: false }} />
        </PostHogProvider>
      ) : (
        <Stack screenOptions={{ headerShown: false }} />
      )}
    </ClerkProvider>
  );
}
