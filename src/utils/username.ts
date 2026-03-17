const USERNAME_REGEX = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
const MIN_LENGTH = 3;
const MAX_LENGTH = 30;

export function validateUsername(username: string): string | null {
  if (username.length < MIN_LENGTH) return `Brukernavn må være minst ${MIN_LENGTH} tegn`;
  if (username.length > MAX_LENGTH) return `Brukernavn kan maks være ${MAX_LENGTH} tegn`;
  if (!USERNAME_REGEX.test(username)) return 'Bare små bokstaver, tall og bindestrek. Kan ikke starte/slutte med bindestrek';
  if (username.includes('--')) return 'Kan ikke ha to bindestreker på rad';
  return null;
}

export function suggestUsername(displayName: string): string {
  return displayName
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, MAX_LENGTH) || 'bruker';
}
