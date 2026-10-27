/**
 * Generates clear, unambiguous CBT tokens (uppercase alphanumeric).
 * Excludes confusing characters like 0/O and 1/I/L by default.
 */

const CLEAR_CBT_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function generateCbtToken(length: number = 6): string {
  let result = '';
  const charactersLength = CLEAR_CBT_CHARS.length;
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charactersLength);
    result += CLEAR_CBT_CHARS.charAt(randomIndex);
  }
  return result;
}

export function sanitizeToken(input: string): string {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
}
