/**
 * @copyright (c) 2026 PT Marstech Global (info@marstech.co.id)
 * @project Standard
 * @file rate_limiter.js
 * @description Helper in-memory rate limiter & account lockout (zero-dependency)
 * @author Senior Backend & Security Engineer
 * @created 2026-10-15
 * @version 1.0.0
 */

const loginAttempts = new Map();

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 menit
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;   // 15 menit

/**
 * Membersihkan entri yang sudah kadaluarsa secara periodik
 */
const cleanupExpiredEntries = () => {
  const now = Date.now();
  for (const [key, record] of loginAttempts.entries()) {
    if (record.lockedUntil && now > record.lockedUntil) {
      loginAttempts.delete(key);
    } else if (!record.lockedUntil && now - record.firstAttempt > ATTEMPT_WINDOW_MS) {
      loginAttempts.delete(key);
    }
  }
};

/**
 * Memeriksa apakah key (IP / username) sedang dalam status lockout
 * @param {string} key - Identifier unik (e.g. "127.0.0.1:admin")
 * @returns {{ isLocked: boolean, remainingAttempts: number, retryAfterMinutes: number }}
 */
export const checkLoginRateLimit = (key) => {
  cleanupExpiredEntries();
  const now = Date.now();
  const record = loginAttempts.get(key);

  if (!record) {
    return { isLocked: false, remainingAttempts: MAX_FAILED_ATTEMPTS, retryAfterMinutes: 0 };
  }

  // Jika sedang terkunci
  if (record.lockedUntil && now < record.lockedUntil) {
    const remainingMs = record.lockedUntil - now;
    const retryAfterMinutes = Math.ceil(remainingMs / (60 * 1000));
    return {
      isLocked: true,
      remainingAttempts: 0,
      retryAfterMinutes: retryAfterMinutes || 1,
    };
  }

  // Jika masa lockout sudah lewat, reset entri
  if (record.lockedUntil && now >= record.lockedUntil) {
    loginAttempts.delete(key);
    return { isLocked: false, remainingAttempts: MAX_FAILED_ATTEMPTS, retryAfterMinutes: 0 };
  }

  const remaining = Math.max(0, MAX_FAILED_ATTEMPTS - record.count);
  return { isLocked: false, remainingAttempts: remaining, retryAfterMinutes: 0 };
};

/**
 * Mencatat percobaan login yang gagal
 * @param {string} key 
 */
export const recordFailedLogin = (key) => {
  const now = Date.now();
  const record = loginAttempts.get(key);

  if (!record) {
    loginAttempts.set(key, {
      count: 1,
      firstAttempt: now,
      lockedUntil: null,
    });
    return;
  }

  record.count += 1;

  if (record.count >= MAX_FAILED_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_DURATION_MS;
  }
};

/**
 * Mereset catatan percobaan login saat login berhasil
 * @param {string} key 
 */
export const recordSuccessfulLogin = (key) => {
  loginAttempts.delete(key);
};

/**
 * Reset seluruh store rate limiter (digunakan untuk testing)
 */
export const resetRateLimiterStore = () => {
  loginAttempts.clear();
};
