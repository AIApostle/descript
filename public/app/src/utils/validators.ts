export function validateAgentName(name: string): string | undefined {
  const trimmed = name.trim();
  if (!trimmed) return 'Agent name is required';
  if (trimmed.length < 3) return 'Name must be at least 3 characters';
  if (trimmed.length > 64) return 'Name must be at most 64 characters';
  if (!/^[a-zA-Z0-9\s\-_]{3,64}$/.test(trimmed)) {
    return 'Name can only contain letters, numbers, spaces, hyphens, and underscores';
  }
  return undefined;
}

export function validateEmail(email: string): string | undefined {
  const trimmed = email.trim();
  if (!trimmed) return 'Email is required';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return 'Please enter a valid email address';
  return undefined;
}

export function validatePassword(password: string): string | undefined {
  if (!password) return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters';
  return undefined;
}

export function validateDescription(description: string): string | undefined {
  if (description.length > 512) return 'Description must be 512 characters or fewer';
  return undefined;
}
