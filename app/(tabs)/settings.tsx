import { useClerk, useUser } from "@clerk/expo";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useCssElement } from "react-native-css";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

export const SafeAreaView = (
  props: React.ComponentProps<typeof RNSafeAreaView> & { className?: string },
) => useCssElement(RNSafeAreaView, props, { className: "style" });

const Settings = () => {
  const { signOut } = useClerk();
  const { user } = useUser();

  const handleSignOut = async () => {
    await signOut();
    router.replace("/auth/sign-in");
  };

  return (
    <SafeAreaView className="flex-1 bg-background p-5">
      <Text className="mb-2 text-3xl font-sans-bold text-primary">Settings</Text>
      <Text className="mb-8 text-base font-sans-medium text-muted-foreground">
        {user?.primaryEmailAddress?.emailAddress ?? "Your account"}
      </Text>
      <View className="rounded-3xl border border-border bg-card p-5">
        <Text className="text-lg font-sans-bold text-primary">Account</Text>
        <Text className="mt-2 text-sm font-sans-medium text-muted-foreground">
          Manage your Recurly account and sign-in preferences.
        </Text>
        <Pressable
          accessibilityRole="button"
          className="mt-6 items-center rounded-2xl bg-primary py-4"
          onPress={() => void handleSignOut()}
        >
          <Text className="font-sans-bold text-background">Sign out</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

export default Settings;
