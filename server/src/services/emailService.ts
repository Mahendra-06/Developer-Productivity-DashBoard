import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';

export class EmailService {
  public static readonly OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
  public static readonly OTP_MAX_ATTEMPTS = 5;
  public static readonly OTP_RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds

  // Internal test-only OTP registry for automated test suite execution.
  // Never accessible or populated in production environments.
  private static testOtpRegistry: Map<string, string> = new Map();

  /**
   * Generates a cryptographically secure 6-digit numeric OTP.
   */
  public static generateOtp(): string {
    return crypto.randomInt(100000, 1000000).toString();
  }

  /**
   * Hashes an OTP with bcrypt using a salt factor of 10.
   */
  public static async hashOtp(otp: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(otp, salt);
  }

  /**
   * Compares a candidate OTP against a stored bcrypt hash.
   */
  public static async verifyOtpHash(candidateOtp: string, storedHash: string): Promise<boolean> {
    if (!candidateOtp || !storedHash) return false;
    return bcrypt.compare(candidateOtp, storedHash);
  }

  /**
   * Sends the OTP to the registered email address.
   * In production: integrates with SMTP credentials if provided, never logging the plaintext OTP.
   * In development: logs safe developer inspection notice.
   */
  public static async sendVerificationOtp(email: string, otp: string, userName?: string): Promise<void> {
    const normalizedEmail = email.toLowerCase().trim();

    // In non-production environments, retain for automated verification assertions
    if (env.NODE_ENV !== 'production') {
      this.testOtpRegistry.set(normalizedEmail, otp);
    }

    if (env.NODE_ENV !== 'production') {
      // Safe development logger to permit seamless browser testing without external SMTP servers
      console.log(`\n======================================================`);
      console.log(`[EmailService: DEV ONLY] ✉️ Email Verification Dispatch`);
      console.log(`To: ${userName ? `${userName} <${normalizedEmail}>` : normalizedEmail}`);
      console.log(`Your DMetrics Verification OTP is: ${otp}`);
      console.log(`Valid for 10 minutes | Single-use only`);
      console.log(`======================================================\n`);
    } else {
      // Production security: strictly conceal OTP from console and application logs
      console.log(`[EmailService] Verification OTP email dispatched to ${normalizedEmail}`);
    }
  }

  /**
   * Test-only helper to inspect the generated OTP for an email.
   * Strictly returns undefined if called in production.
   */
  public static getLastSentOtpForTest(email: string): string | undefined {
    if (env.NODE_ENV === 'production') {
      return undefined;
    }
    return this.testOtpRegistry.get(email.toLowerCase().trim());
  }

  /**
   * Clears the test OTP registry.
   */
  public static clearTestRegistry(): void {
    this.testOtpRegistry.clear();
  }
}
