export type AuthField = "email" | "password" | "code";
export type AuthValidationErrors = Partial<Record<AuthField, string>>;

export function validateEmailAddress(email: string): string | undefined {
  const value = email.trim();
  if (!value) return "Enter your email address.";
  if (value.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return "Enter a valid email address.";
  }
  return undefined;
}

export function validatePassword(password: string): string | undefined {
  if (!password) return "Create a password.";
  if (password.length < 8) return "Use at least 8 characters.";
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return "Include at least one letter and one number.";
  }
  return undefined;
}

export function validateVerificationCode(code: string): string | undefined {
  if (!code.trim()) return "Enter the verification code.";
  if (!/^\d{6}$/.test(code.trim())) {
    return "Enter the 6-digit code from your email.";
  }
  return undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(
  record: Record<string, unknown>,
  key: string,
): string | undefined {
  const value = record[key];
  return typeof value === "string" && value.trim() ? value : undefined;
}

export function getClerkErrorMessage(error: unknown, fallback: string): string {
  if (!isRecord(error)) return fallback;

  const errors = error.errors;
  if (Array.isArray(errors)) {
    for (const item of errors) {
      if (!isRecord(item)) continue;

      const code = readString(item, "code");
      if (code === "form_identifier_not_found") {
        return "We couldn't find an account with that email. Check it or create an account.";
      }
      if (code === "form_password_incorrect") {
        return "That password doesn't match this account. Try again.";
      }
      if (code === "form_identifier_exists") {
        return "An account with this email already exists. Sign in instead.";
      }
      if (code === "form_password_pwned") {
        return "This password has appeared in a data breach. Please choose another.";
      }

      const message =
        readString(item, "longMessage") ?? readString(item, "message");
      if (message) return message;
    }
  }

  return readString(error, "longMessage") ?? fallback;
}
