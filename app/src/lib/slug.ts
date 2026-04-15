const ALPHABET = 'abcdefghijklmnopqrstuvwxyz234567';

export function generateSlug(length = 10): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += ALPHABET[bytes[i]! % 32];
  }
  return out;
}
