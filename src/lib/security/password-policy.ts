export type PasswordPolicyResult = { valid: boolean; errors: string[] };

const MIN_LENGTH = 8;
const MAX_LENGTH = 128;

export function validatePasswordPolicy(password: string): PasswordPolicyResult {
  const errors: string[] = [];

  if (password.length < MIN_LENGTH)
    errors.push(`Password must be at least ${MIN_LENGTH} characters`);
  if (password.length > MAX_LENGTH)
    errors.push(`Password must be at most ${MAX_LENGTH} characters`);
  if (!/[A-Z]/.test(password)) errors.push("Include at least one uppercase letter");
  if (!/[a-z]/.test(password)) errors.push("Include at least one lowercase letter");
  if (!/[0-9]/.test(password)) errors.push("Include at least one number");
  if (!/[^A-Za-z0-9]/.test(password)) errors.push("Include at least one special character");

  const common = ["password", "12345678", "qwerty", "admin123", "shreeshyam"];
  if (common.some((c) => password.toLowerCase().includes(c))) {
    errors.push("Password is too common");
  }

  return { valid: errors.length === 0, errors };
}

export function passwordPolicyMessage(): string {
  return "Min 8 chars, uppercase, lowercase, number, and special character";
}
