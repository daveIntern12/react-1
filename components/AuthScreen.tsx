import { useSignIn, useSignUp } from "@clerk/expo";
import { clsx } from "clsx";
import { Link, router } from "expo-router";
import type { ComponentProps, ComponentRef } from "react";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useCssElement } from "react-native-css";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";
import { colors } from "../constants/theme";
import { posthog } from "../lib/posthog";
import { posthogLogger } from "../lib/posthog-logger";
import {
  type AuthField,
  type AuthValidationErrors,
  getClerkErrorMessage,
  validateEmailAddress,
  validatePassword,
  validateVerificationCode,
} from "../lib/auth-validation";

type AuthScreenProps = {
  mode: "sign-in" | "sign-up";
};

type AuthStep = "credentials" | "verify-email" | "mfa";
type FieldErrors = AuthValidationErrors;

const SafeAreaView = (
  props: ComponentProps<typeof RNSafeAreaView> & { className?: string },
) => useCssElement(RNSafeAreaView, props, { className: "style" });

export default function AuthScreen({ mode }: AuthScreenProps) {
  const { signIn, fetchStatus: signInFetchStatus } = useSignIn();
  const { signUp, fetchStatus: signUpFetchStatus } = useSignUp();
  const [step, setStep] = useState<AuthStep>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const passwordInputRef = useRef<ComponentRef<typeof TextInput>>(null);

  const isSignUp = mode === "sign-up";
  const isVerifying = step === "verify-email";
  const isMfa = step === "mfa";
  const isBusy =
    isSubmitting ||
    (isSignUp
      ? signUpFetchStatus === "fetching"
      : signInFetchStatus === "fetching");

  const clearFieldError = (field: AuthField) => {
    setFieldErrors((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const navigateToApp = () => {
    router.replace("/(tabs)");
  };

  const handleCredentialsSubmit = async () => {
    setApiError(null);
    const errors: FieldErrors = {};
    const emailError = validateEmailAddress(email);
    if (emailError) errors.email = emailError;
    if (isSignUp) {
      const passwordError = validatePassword(password);
      if (passwordError) errors.password = passwordError;
    } else if (!password) {
      errors.password = "Enter your password.";
    }

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsSubmitting(true);
    try {
      const emailAddress = email.trim().toLowerCase();

      if (isSignUp) {
        const { error } = await signUp.password({ emailAddress, password });
        if (error) {
          setApiError(
            getClerkErrorMessage(
              error,
              "We couldn't create your account. Please try again.",
            ),
          );
          return;
        }

        if (signUp.status === "complete") {
          await signUp.finalize({ navigate: navigateToApp });
          posthog?.capture("account_created");
          posthogLogger.info("account_creation_completed", {
            auth_method: "password",
          });
          return;
        }

        if (
          signUp.status === "missing_requirements" &&
          signUp.unverifiedFields.includes("email_address")
        ) {
          const { error: verificationError } =
            await signUp.verifications.sendEmailCode();
          if (verificationError) {
            setApiError(
              getClerkErrorMessage(
                verificationError,
                "We couldn't send a verification code. Please try again.",
              ),
            );
            return;
          }

          setStep("verify-email");
          return;
        }

        setApiError(
          "We need a little more information to finish creating your account. Please contact support.",
        );
        return;
      }

      const { error } = await signIn.password({ emailAddress, password });
      if (error) {
        setApiError(
          getClerkErrorMessage(
            error,
            "We couldn't sign you in. Check your details and try again.",
          ),
        );
        return;
      }

      if (signIn.status === "complete") {
        await signIn.finalize({ navigate: navigateToApp });
        posthog?.capture("sign_in_completed", { auth_method: "password" });
        posthogLogger.info("authentication_completed", {
          auth_method: "password",
        });
        return;
      }

      if (signIn.status === "needs_second_factor") {
        if (
          signIn.supportedSecondFactors.some(
            (factor) => factor.strategy === "totp",
          )
        ) {
          setStep("mfa");
          return;
        }
      }

      setApiError(
        "Your account requires an additional verification step. Please contact support for help signing in.",
      );
    } catch (error) {
      setApiError(
        getClerkErrorMessage(
          error,
          isSignUp
            ? "We couldn't create your account. Check your connection and try again."
            : "We couldn't sign you in. Check your connection and try again.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyMfa = async () => {
    setApiError(null);
    const codeError = validateVerificationCode(mfaCode);
    if (codeError) {
      setFieldErrors({ code: codeError });
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);
    try {
      const { error } = await signIn.mfa.verifyTOTP({ code: mfaCode.trim() });
      if (error) {
        setApiError(
          getClerkErrorMessage(
            error,
            "That code couldn't be verified. Check it and try again.",
          ),
        );
        return;
      }
      if (signIn.status === "complete") {
        await signIn.finalize({ navigate: navigateToApp });
        posthog?.capture("sign_in_completed", { auth_method: "mfa" });
        posthogLogger.info("authentication_completed", { auth_method: "mfa" });
        return;
      }
      setApiError(
        "We couldn't finish verifying this sign-in. Please try again.",
      );
    } catch (error) {
      setApiError(
        getClerkErrorMessage(
          error,
          "We couldn't verify your code. Please try again.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyEmail = async () => {
    setApiError(null);
    const codeError = validateVerificationCode(code);
    if (codeError) {
      setFieldErrors({ code: codeError });
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);
    try {
      const { error } = await signUp.verifications.verifyEmailCode({
        code: code.trim(),
      });
      if (error) {
        setApiError(
          getClerkErrorMessage(
            error,
            "That code couldn't be verified. Check it and try again.",
          ),
        );
        return;
      }

      if (signUp.status === "complete") {
        await signUp.finalize({ navigate: navigateToApp });
        posthog?.capture("account_created");
        posthogLogger.info("account_creation_completed", {
          auth_method: "email_verification",
        });
        return;
      }

      setApiError(
        "Your email is verified, but your account needs more information. Please contact support.",
      );
    } catch (error) {
      setApiError(
        getClerkErrorMessage(
          error,
          "We couldn't verify your email. Check your connection and try again.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    setApiError(null);
    setIsSubmitting(true);
    try {
      const { error } = await signUp.verifications.sendEmailCode();
      if (error) {
        setApiError(
          getClerkErrorMessage(
            error,
            "We couldn't send a new code. Please try again.",
          ),
        );
      }
    } catch (error) {
      setApiError(
        getClerkErrorMessage(
          error,
          "We couldn't send a new code. Check your connection and try again.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    clearFieldError("email");
    setApiError(null);
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    clearFieldError("password");
    setApiError(null);
  };

  return (
    <SafeAreaView className="auth-safe-area">
      <KeyboardAvoidingView
        className="auth-screen"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          className="auth-scroll"
          contentContainerClassName="auth-content"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="auth-brand-block">
            <View className="auth-logo-wrap">
              <View className="auth-logo-mark">
                <Text className="auth-logo-mark-text">R</Text>
              </View>
              <View>
                <Text className="auth-wordmark">Recurly</Text>
                <Text className="auth-wordmark-sub">SUBSCRIPTION TRACKER</Text>
              </View>
            </View>
            <Text className="auth-title">
              {isMfa
                ? "Verify your sign-in"
                : isVerifying
                  ? "Check your email"
                  : isSignUp
                    ? "Create your account"
                    : "Welcome back"}
            </Text>
            <Text className="auth-subtitle">
              {isMfa
                ? "Enter the code from your authenticator app to continue."
                : isVerifying
                  ? `Enter the 6-digit code we sent to ${email.trim()}.`
                  : isSignUp
                    ? "One account to keep your subscriptions in check."
                    : "Sign in to see what's renewing and when."}
            </Text>
          </View>

          <View className="auth-card">
            {isMfa ? (
              <View className="auth-form">
                <View className="auth-field">
                  <Text className="auth-label">Authenticator code</Text>
                  <TextInput
                    accessibilityLabel="Authenticator code"
                    autoComplete="one-time-code"
                    autoCorrect={false}
                    autoFocus
                    className={clsx(
                      "auth-input",
                      fieldErrors.code && "auth-input-error",
                    )}
                    keyboardType="number-pad"
                    maxLength={6}
                    onChangeText={(value) => {
                      setMfaCode(value.replace(/\D/g, "").slice(0, 6));
                      clearFieldError("code");
                      setApiError(null);
                    }}
                    onSubmitEditing={() => void handleVerifyMfa()}
                    returnKeyType="done"
                    textContentType="oneTimeCode"
                    value={mfaCode}
                  />
                  {fieldErrors.code ? (
                    <Text accessibilityRole="alert" className="auth-error">
                      {fieldErrors.code}
                    </Text>
                  ) : null}
                  <Text className="auth-helper">
                    Use the 6-digit code generated by your authenticator app.
                  </Text>
                </View>
                {apiError ? (
                  <Text accessibilityRole="alert" className="auth-error-banner">
                    {apiError}
                  </Text>
                ) : null}
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ busy: isBusy, disabled: isBusy }}
                  className={clsx(
                    "auth-button",
                    isBusy && "auth-button-disabled",
                  )}
                  disabled={isBusy}
                  onPress={() => void handleVerifyMfa()}
                >
                  <View className="auth-button-content">
                    {isBusy ? (
                      <ActivityIndicator color={colors.primary} size="small" />
                    ) : null}
                    <Text className="auth-button-text">
                      {isBusy ? "Verifying..." : "Verify code"}
                    </Text>
                  </View>
                </Pressable>
              </View>
            ) : isVerifying ? (
              <View className="auth-form">
                <View className="auth-field">
                  <Text className="auth-label">Email verification code</Text>
                  <TextInput
                    accessibilityLabel="Email verification code"
                    autoComplete="one-time-code"
                    autoCorrect={false}
                    autoFocus
                    className={clsx(
                      "auth-input",
                      fieldErrors.code && "auth-input-error",
                    )}
                    keyboardType="number-pad"
                    maxLength={6}
                    onChangeText={(value) => {
                      setCode(value.replace(/\D/g, "").slice(0, 6));
                      clearFieldError("code");
                      setApiError(null);
                    }}
                    onSubmitEditing={() => void handleVerifyEmail()}
                    returnKeyType="done"
                    textContentType="oneTimeCode"
                    value={code}
                  />
                  {fieldErrors.code ? (
                    <Text accessibilityRole="alert" className="auth-error">
                      {fieldErrors.code}
                    </Text>
                  ) : null}
                </View>

                {apiError ? (
                  <Text accessibilityRole="alert" className="auth-error-banner">
                    {apiError}
                  </Text>
                ) : null}

                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ busy: isBusy, disabled: isBusy }}
                  className={clsx(
                    "auth-button",
                    isBusy && "auth-button-disabled",
                  )}
                  disabled={isBusy}
                  onPress={() => void handleVerifyEmail()}
                >
                  <View className="auth-button-content">
                    {isBusy ? (
                      <ActivityIndicator color={colors.primary} size="small" />
                    ) : null}
                    <Text className="auth-button-text">
                      {isBusy ? "Verifying..." : "Verify email"}
                    </Text>
                  </View>
                </Pressable>

                <View className="auth-resend-row">
                  <Text className="auth-helper">Didn&apos;t get a code?</Text>
                  <Pressable
                    accessibilityRole="button"
                    disabled={isBusy}
                    onPress={() => void handleResendCode()}
                  >
                    <Text className="auth-link">Resend code</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <View className="auth-form">
                <View className="auth-field">
                  <Text className="auth-label">Email</Text>
                  <TextInput
                    accessibilityLabel="Email address"
                    autoCapitalize="none"
                    autoComplete="email"
                    autoCorrect={false}
                    className={clsx(
                      "auth-input",
                      fieldErrors.email && "auth-input-error",
                    )}
                    keyboardType="email-address"
                    maxLength={254}
                    onChangeText={handleEmailChange}
                    onSubmitEditing={() => passwordInputRef.current?.focus()}
                    returnKeyType="next"
                    textContentType="emailAddress"
                    value={email}
                  />
                  {fieldErrors.email ? (
                    <Text accessibilityRole="alert" className="auth-error">
                      {fieldErrors.email}
                    </Text>
                  ) : null}
                </View>

                <View className="auth-field">
                  <Text className="auth-label">Password</Text>
                  <View
                    className={clsx(
                      "auth-input-wrap",
                      fieldErrors.password && "auth-input-error",
                    )}
                  >
                    <TextInput
                      ref={passwordInputRef}
                      accessibilityLabel="Password"
                      autoCapitalize="none"
                      autoComplete={
                        isSignUp ? "new-password" : "current-password"
                      }
                      autoCorrect={false}
                      className="auth-input-contained"
                      onChangeText={handlePasswordChange}
                      onSubmitEditing={() => void handleCredentialsSubmit()}
                      returnKeyType="done"
                      secureTextEntry={!isPasswordVisible}
                      textContentType={isSignUp ? "newPassword" : "password"}
                      value={password}
                    />
                    <Pressable
                      accessibilityLabel={
                        isPasswordVisible ? "Hide password" : "Show password"
                      }
                      accessibilityRole="button"
                      onPress={() =>
                        setIsPasswordVisible((visible) => !visible)
                      }
                      className="auth-input-action"
                    >
                      <Text className="auth-input-action-text">
                        {isPasswordVisible ? "Hide" : "Show"}
                      </Text>
                    </Pressable>
                  </View>
                  {fieldErrors.password ? (
                    <Text accessibilityRole="alert" className="auth-error">
                      {fieldErrors.password}
                    </Text>
                  ) : isSignUp ? (
                    <Text className="auth-helper">
                      Use at least 8 characters with letters and numbers.
                    </Text>
                  ) : null}
                </View>

                {apiError ? (
                  <Text accessibilityRole="alert" className="auth-error-banner">
                    {apiError}
                  </Text>
                ) : null}

                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ busy: isBusy, disabled: isBusy }}
                  className={clsx(
                    "auth-button",
                    isBusy && "auth-button-disabled",
                  )}
                  disabled={isBusy}
                  onPress={() => void handleCredentialsSubmit()}
                >
                  <View className="auth-button-content">
                    {isBusy ? (
                      <ActivityIndicator color={colors.primary} size="small" />
                    ) : null}
                    <Text className="auth-button-text">
                      {isBusy
                        ? isSignUp
                          ? "Creating account..."
                          : "Signing in..."
                        : isSignUp
                          ? "Create account"
                          : "Sign in"}
                    </Text>
                  </View>
                </Pressable>
              </View>
            )}

            <View className="auth-link-row">
              <Text className="auth-link-copy">
                {isMfa
                  ? "Need to start over?"
                  : isVerifying
                    ? "Wrong email address?"
                    : isSignUp
                      ? "Already have an account?"
                      : "New to Recurly?"}
              </Text>
              {isMfa ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setStep("credentials")}
                >
                  <Text className="auth-link">Go back</Text>
                </Pressable>
              ) : isVerifying ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    setStep("credentials");
                    setApiError(null);
                    setCode("");
                  }}
                >
                  <Text className="auth-link">Go back</Text>
                </Pressable>
              ) : (
                <Link
                  className="auth-link"
                  href={isSignUp ? "/auth/sign-in" : "/auth/sign-up"}
                >
                  {isSignUp ? "Sign in" : "Create an account"}
                </Link>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
