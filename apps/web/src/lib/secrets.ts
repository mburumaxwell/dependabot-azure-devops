export type SecretValidationResult = {
  valid: boolean;
  error?: string;
};

/** Validates if a secret name is valid. */
export function validateSecretNameFormat(name: string): SecretValidationResult {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'Secret name is required' };
  }

  if (name.length > 100) {
    return { valid: false, error: 'Secret name must be 100 characters or less' };
  }

  const nameRegex = /^[a-zA-Z0-9_-]+$/;
  if (!nameRegex.test(name)) {
    return {
      valid: false,
      error: 'Secret name must contain only letters, numbers, underscores, and hyphens',
    };
  }

  return { valid: true };
}
