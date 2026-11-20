/**
 * Security Rate Limiter & Verification Gate
 * Protects against brute-force attacks, credential stuffing, and spamming.
 */

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const memoryStore = new Map<string, RateLimitRecord>();

// Clean up expired keys every 5 minutes to prevent memory leaks
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of memoryStore.entries()) {
      if (now > record.resetAt) {
        memoryStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

/**
 * Extracts the real client IP address from request headers.
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return (
    req.headers.get("x-real-ip") ||
    req.headers.get("cf-connecting-ip") ||
    "127.0.0.1"
  );
}

/**
 * Rate limiter check
 * @param key Unique key (e.g., `login:ip:email`)
 * @param limit Max allowed attempts in the window
 * @param windowSeconds Window length in seconds
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): { allowed: boolean; remaining: number; resetSeconds: number } {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const existing = memoryStore.get(key);

  if (!existing || now > existing.resetAt) {
    memoryStore.set(key, { count: 1, resetAt: now + windowMs });
    return {
      allowed: true,
      remaining: limit - 1,
      resetSeconds: windowSeconds,
    };
  }

  if (existing.count >= limit) {
    const resetSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
    return {
      allowed: false,
      remaining: 0,
      resetSeconds,
    };
  }

  existing.count += 1;
  const resetSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
  return {
    allowed: true,
    remaining: Math.max(0, limit - existing.count),
    resetSeconds,
  };
}

/**
 * Validates password strength according to security standards.
 * Minimum 8 characters, at least 1 letter, and 1 number.
 */
export function validatePasswordStrength(password: string): { valid: boolean; error?: string } {
  if (!password || typeof password !== "string") {
    return { valid: false, error: "Password is required." };
  }
  if (password.length < 8) {
    return { valid: false, error: "Password must be at least 8 characters long." };
  }
  if (!/[A-Za-z]/.test(password)) {
    return { valid: false, error: "Password must contain at least one letter." };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: "Password must contain at least one number." };
  }
  return { valid: true };
}

/**
 * Checks if the last sign in was more than 3 months ago (approx 90 days).
 * "never ask for a verification if the last sign in is under 3 months"
 */
export function isOverThreeMonths(lastLoginAt?: string | Date | null): boolean {
  if (!lastLoginAt) return true; // Never signed in or missing -> require verification

  const THREE_MONTHS_MS = 90 * 24 * 60 * 60 * 1000; // 90 days in milliseconds
  const lastLoginTime = new Date(lastLoginAt).getTime();
  if (isNaN(lastLoginTime)) return true;

  const diff = Date.now() - lastLoginTime;
  return diff > THREE_MONTHS_MS;
}
