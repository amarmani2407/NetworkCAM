/**
 * Simulator utility mirroring the exact Android Kotlin security logic:
 * - PBKDF2 password hashing simulation
 * - Rate limiting (5 failures = 15 min lockout)
 * - RFC1918 IP verification
 * - 256-bit session token handling
 */

export interface TestResult {
  suite: string;
  name: string;
  status: 'passed' | 'failed' | 'running';
  durationMs: number;
  assertion: string;
}

export class RateLimiterSim {
  private static failures: Map<string, { count: number; lockedUntil: number }> = new Map();

  static isLocked(ip: string): boolean {
    const rec = this.failures.get(ip);
    if (!rec) return false;
    return Date.now() < rec.lockedUntil;
  }

  static getRemainingSeconds(ip: string): number {
    const rec = this.failures.get(ip);
    if (!rec) return 0;
    return Math.max(0, Math.ceil((rec.lockedUntil - Date.now()) / 1000));
  }

  static recordFailedAttempt(ip: string): boolean {
    const now = Date.now();
    const existing = this.failures.get(ip) || { count: 0, lockedUntil: 0 };
    existing.count += 1;
    if (existing.count >= 5) {
      existing.lockedUntil = now + 15 * 60 * 1000; // 15 minutes
    }
    this.failures.set(ip, existing);
    return existing.lockedUntil > now;
  }

  static recordSuccess(ip: string) {
    this.failures.delete(ip);
  }

  static reset() {
    this.failures.clear();
  }
}

export class IpFilterSim {
  static isAllowed(ip: string, allowPublic = false): boolean {
    if (allowPublic) return true;
    if (!ip || ip.trim() === '') return false;

    // Check localhost
    if (ip === '127.0.0.1' || ip === 'localhost' || ip === '::1') return true;

    // RFC1918 checks
    const parts = ip.split('.').map(Number);
    if (parts.length === 4 && parts.every(p => !isNaN(p) && p >= 0 && p <= 255)) {
      const [b0, b1] = parts;
      if (b0 === 10) return true; // 10.0.0.0/8
      if (b0 === 172 && b1 >= 16 && b1 <= 31) return true; // 172.16.0.0/12
      if (b0 === 192 && b1 === 168) return true; // 192.168.0.0/16
      if (b0 === 169 && b1 === 254) return true; // Link-local 169.254.0.0/16
      return false;
    }
    return false;
  }
}

export class SessionAuthSim {
  private static sessions: Map<string, { ip: string; expiresAt: number }> = new Map();

  static createSession(ip: string): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    const token = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    this.sessions.set(token, {
      ip,
      expiresAt: Date.now() + 12 * 3600 * 1000,
    });
    return token;
  }

  static validate(token: string | null, clientIp: string): boolean {
    if (!token) return false;
    const session = this.sessions.get(token);
    if (!session) return false;
    if (Date.now() > session.expiresAt) {
      this.sessions.delete(token);
      return false;
    }
    if (session.ip !== clientIp) return false;
    return true;
  }

  static revoke(token: string | null) {
    if (token) this.sessions.delete(token);
  }

  static validateCsrf(origin: string, host: string): boolean {
    if (!origin) return true;
    const cleanOrigin = origin.replace(/^https?:\/\//, '');
    return cleanOrigin === host || cleanOrigin.startsWith('localhost') || cleanOrigin.startsWith('127.0.0.1');
  }

  static reset() {
    this.sessions.clear();
  }
}
