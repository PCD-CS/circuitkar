export const GSTIN_REGEX =
  /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
export const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

export function isValidGSTIN(value: string): boolean {
  return GSTIN_REGEX.test(value.trim().toUpperCase());
}

export function isValidPAN(value: string): boolean {
  return PAN_REGEX.test(value.trim().toUpperCase());
}

export function isValidPincode(value: string): boolean {
  return /^[1-9][0-9]{5}$/.test(value.trim());
}

export function isValidPhone(value: string): boolean {
  return /^[6-9][0-9]{9}$/.test(value.trim());
}

export type PasswordStrength = "weak" | "medium" | "strong";

export function passwordStrength(pw: string): PasswordStrength {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 2) return "weak";
  if (score <= 3) return "medium";
  return "strong";
}
