import { useClerk, useUser } from "@clerk/expo";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useCssElement } from "react-native-css";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";
import { colors } from "../../constants/theme";

export const SafeAreaView = (props: React.ComponentProps<typeof RNSafeAreaView> & { className?: string }) =>
  useCssElement(RNSafeAreaView, props, { className: "style" });

const Settings = () => {
  const { signOut } = useClerk();
  const { user } = useUser();
  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const initials = useMemo(() => {
    const letters = `${firstName} ${lastName}`.trim().split(/\s+/).filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
    return letters || user?.primaryEmailAddress?.emailAddress[0]?.toUpperCase() || "U";
  }, [firstName, lastName, user]);

  if (!user) return null;

  const email = user.primaryEmailAddress?.emailAddress ?? "No email address";
  const hasChanges = firstName.trim() !== (user.firstName ?? "") || lastName.trim() !== (user.lastName ?? "");

  const handleSave = async () => {
    const nextFirstName = firstName.trim();
    const nextLastName = lastName.trim();
    if (!nextFirstName || !nextLastName) {
      setMessage("Add both your first and last name to continue.");
      return;
    }
    setMessage(null);
    setIsSaving(true);
    try {
      await user.update({ firstName: nextFirstName, lastName: nextLastName });
      await user.reload();
      setMessage("Profile updated.");
    } catch {
      setMessage("We couldn't update your profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      router.replace("/auth/sign-in");
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerClassName="px-5 pb-30 pt-5" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Text className="text-3xl font-sans-bold text-primary">Profile</Text>
          <Text className="mt-2 text-base font-sans-medium text-muted-foreground">Keep your account details up to date.</Text>

          <View className="mt-8 items-center rounded-3xl bg-primary px-5 py-7">
            {user.imageUrl ? (
              <Image accessibilityLabel="Profile photo" className="size-24 rounded-full border-4 border-accent" source={{ uri: user.imageUrl }} />
            ) : (
              <View className="size-24 items-center justify-center rounded-full bg-accent">
                <Text className="text-3xl font-sans-extrabold text-primary">{initials}</Text>
              </View>
            )}
            <Text className="mt-4 text-xl font-sans-bold text-background">{[firstName, lastName].filter(Boolean).join(" ") || "Your profile"}</Text>
            <Text className="mt-1 text-sm font-sans-medium text-background/70">{email}</Text>
          </View>

          <View className="mt-5 rounded-3xl border border-border bg-card p-5">
            <Text className="text-lg font-sans-bold text-primary">Personal details</Text>
            <Text className="mt-1 text-sm font-sans-medium text-muted-foreground">This is how your name appears in Recurly.</Text>
            <View className="mt-5 gap-4">
              <View className="gap-2">
                <Text className="text-sm font-sans-semibold text-primary">First name</Text>
                <TextInput autoCapitalize="words" className="rounded-2xl border border-border bg-background px-4 py-4 text-base font-sans-medium text-primary" onChangeText={(value) => { setFirstName(value); setMessage(null); }} placeholder="First name" placeholderTextColor={colors.mutedForeground} value={firstName} />
              </View>
              <View className="gap-2">
                <Text className="text-sm font-sans-semibold text-primary">Last name</Text>
                <TextInput autoCapitalize="words" className="rounded-2xl border border-border bg-background px-4 py-4 text-base font-sans-medium text-primary" onChangeText={(value) => { setLastName(value); setMessage(null); }} placeholder="Last name" placeholderTextColor={colors.mutedForeground} value={lastName} />
              </View>
            </View>
            {message ? <Text className="mt-4 text-sm font-sans-medium text-muted-foreground">{message}</Text> : null}
            <Pressable accessibilityRole="button" accessibilityState={{ busy: isSaving, disabled: isSaving || !hasChanges }} className={`mt-5 items-center rounded-2xl py-4 ${isSaving || !hasChanges ? "bg-accent/45" : "bg-accent"}`} disabled={isSaving || !hasChanges} onPress={() => void handleSave()}>
              <View className="flex-row items-center gap-2">
                {isSaving ? <ActivityIndicator color={colors.primary} size="small" /> : null}
                <Text className="font-sans-bold text-primary">{isSaving ? "Saving..." : "Save changes"}</Text>
              </View>
            </Pressable>
          </View>

          <View className="mt-5 rounded-3xl border border-border bg-card p-5">
            <Text className="text-lg font-sans-bold text-primary">Account information</Text>
            <View className="mt-5 gap-4">
              <View><Text className="text-xs font-sans-semibold uppercase tracking-[1px] text-muted-foreground">Email address</Text><Text className="mt-1 text-base font-sans-semibold text-primary">{email}</Text></View>
              <View><Text className="text-xs font-sans-semibold uppercase tracking-[1px] text-muted-foreground">Account ID</Text><Text selectable className="mt-1 text-sm font-sans-medium text-primary">{user.id}</Text></View>
            </View>
          </View>

          <Pressable accessibilityRole="button" accessibilityState={{ busy: isSigningOut, disabled: isSigningOut }} className="mt-5 items-center rounded-2xl border border-destructive/30 py-4" disabled={isSigningOut} onPress={() => void handleSignOut()}>
            <Text className="font-sans-bold text-destructive">{isSigningOut ? "Signing out..." : "Sign out"}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Settings;
