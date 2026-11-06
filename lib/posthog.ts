import Constants from "expo-constants";
import PostHog from "posthog-react-native";

type PostHogExtra = {
  posthogProjectToken?: string;
  posthogHost?: string;
};

const { posthogProjectToken, posthogHost } =
  (Constants.expoConfig?.extra as PostHogExtra | undefined) ?? {};

if (__DEV__ && !posthogProjectToken) {
  throw new Error(
    "EXPO_PUBLIC_POSTHOG_PROJECT_TOKEN variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once EXPO_PUBLIC_POSTHOG_PROJECT_TOKEN is configured",
  );
}

if (__DEV__ && !posthogHost) {
  throw new Error(
    "EXPO_PUBLIC_POSTHOG_HOST variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once EXPO_PUBLIC_POSTHOG_HOST is configured",
  );
}

export const posthog =
  posthogProjectToken && posthogHost
    ? new PostHog(posthogProjectToken, {
        host: posthogHost,
        captureAppLifecycleEvents: true,
        logs: {
          serviceName: "recurly-mobile",
          environment: __DEV__ ? "development" : "production",
          serviceVersion: Constants.expoConfig?.version,
        },
        errorTracking: {
          autocapture: {
            uncaughtExceptions: true,
            unhandledRejections: true,
          },
        },
      })
    : undefined;
