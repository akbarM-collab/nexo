import bcrypt from 'bcryptjs';

/**
 * Utility keamanan hashing password menggunakan bcrypt
 */
export async function hashPassword(plainText: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainText, salt);
}

export function hashPasswordSync(plainText: string): string {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(plainText, salt);
}

export async function verifyPassword(plainText: string, hashedOrPlain: string): Promise<boolean> {
  if (!plainText || !hashedOrPlain) return false;
  // Jika password tersimpan berformat bcrypt hash ($2a$ atau $2b$)
  if (hashedOrPlain.startsWith('$2a$') || hashedOrPlain.startsWith('$2b$')) {
    try {
      return await bcrypt.compare(plainText, hashedOrPlain);
    } catch {
      return false;
    }
  }
  // Fallback direct match jika belum ter-hash
  return plainText === hashedOrPlain;
}

export function verifyPasswordSync(plainText: string, hashedOrPlain: string): boolean {
  if (!plainText || !hashedOrPlain) return false;
  if (hashedOrPlain.startsWith('$2a$') || hashedOrPlain.startsWith('$2b$')) {
    try {
      return bcrypt.compareSync(plainText, hashedOrPlain);
    } catch {
      return false;
    }
  }
  return plainText === hashedOrPlain;
}
