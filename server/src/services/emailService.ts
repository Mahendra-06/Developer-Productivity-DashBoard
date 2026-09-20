import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';

export class EmailService {
  public static readonly OTP_EXPIRY_MS = 10 * 60 * 1000;
  public static readonly OTP_MAX_ATTEMPTS = 5;
  public static readonly OTP_RESEND_COOLDOWN_MS = 60 * 1000;

  private static readonly testOtpRegistry = new Map<string, string>();

  public static generateOtp(): string {
    return crypto.randomInt(100000, 1000000).toString();
  }

  public static async hashOtp(otp: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(otp, salt);
  }

  public static async verifyOtpHash(
    candidateOtp: string,
    storedHash: string
  ): Promise<boolean> {
    if (!candidateOtp || !storedHash) {
      return false;
    }

    return bcrypt.compare(candidateOtp, storedHash);
  }

  public static async sendVerificationOtp(
    email: string,
    otp: string,
    userName?: string
  ): Promise<void> {
    const normalizedEmail = email.trim().toLowerCase();

    // Log OTP to server console as an immediate backup/fallback
    console.log(`\n======================================================`);
    console.log(`[EmailService] ✉️  Verification OTP for ${normalizedEmail}: ${otp}`);
    console.log(`======================================================\n`);

    if (env.NODE_ENV !== 'production') {
      this.testOtpRegistry.set(normalizedEmail, otp);
    }

    const displayName = userName?.trim() || 'there';
    const emailSubject = 'Your DMetrics email verification code';
    const emailText = [
      `Hello ${displayName},`,
      '',
      `Your DMetrics verification code is: ${otp}`,
      '',
      'This code expires in 10 minutes and can only be used once.',
      '',
      'If you did not create a DMetrics account, you can ignore this email.',
    ].join('\n');

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #172033; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #4f46e5; margin-top: 0;">Verify your DMetrics email</h2>
        <p>Hello ${displayName},</p>
        <p>Use the verification code below to complete your registration:</p>

        <div style="
          display: inline-block;
          padding: 12px 24px;
          margin: 16px 0;
          border-radius: 8px;
          background: #eef2ff;
          color: #3730a3;
          font-size: 28px;
          font-weight: 700;
          letter-spacing: 6px;
        ">
          ${otp}
        </div>

        <p style="color: #64748b; font-size: 14px;">This code expires in 10 minutes and can only be used once.</p>
        <p style="color: #94a3b8; font-size: 12px; margin-bottom: 0;">If you did not request this, you can safely ignore this email.</p>
      </div>
    `;

    /*
     * Send via Resend HTTP REST API (Port 443 - HTTPS)
     */
    if (env.RESEND_API_KEY) {
      try {
        let fromAddress = env.RESEND_FROM || 'DMetrics <onboarding@resend.dev>';
        // Public webmail domains (@gmail.com, etc.) cannot be used as sender in Resend without domain ownership
        if (
          fromAddress.includes('@gmail.com') ||
          fromAddress.includes('@yahoo.com') ||
          fromAddress.includes('@outlook.com') ||
          fromAddress.includes('@hotmail.com')
        ) {
          console.warn(
            `[EmailService] Sender address '${fromAddress}' is an unverified public webmail domain. Using 'DMetrics <onboarding@resend.dev>' instead.`
          );
          fromAddress = 'DMetrics <onboarding@resend.dev>';
        }

        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: fromAddress,
            to: [normalizedEmail],
            subject: emailSubject,
            text: emailText,
            html: emailHtml,
          }),
        });

        if (!res.ok) {
          const errBody = await res.text();
          throw new Error(`Resend HTTP error ${res.status}: ${errBody}`);
        }

        console.log(
          `[EmailService] Verification email sent to ${normalizedEmail} via Resend HTTP API`
        );
        return;
      } catch (resendError) {
        console.error(
          `[EmailService] Resend API delivery failed for ${normalizedEmail}:`,
          resendError
        );
        throw resendError;
      }
    }

    /*
     * Fallback for development/testing when RESEND_API_KEY is not configured
     */
    console.warn(
      '[EmailService] RESEND_API_KEY is not configured. OTP is available only in the backend terminal.'
    );
    console.log(`[EmailService: CONSOLE ONLY] Recipient: ${normalizedEmail}`);
    console.log(`[EmailService: CONSOLE ONLY] OTP: ${otp}`);
    console.log('[EmailService: CONSOLE ONLY] OTP expires in 10 minutes.');
  }

  public static getLastSentOtpForTest(
    email: string
  ): string | undefined {
    if (env.NODE_ENV === 'production') {
      return undefined;
    }

    return this.testOtpRegistry.get(email.trim().toLowerCase());
  }

  public static clearTestRegistry(): void {
    this.testOtpRegistry.clear();
  }
}