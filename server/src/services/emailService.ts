import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
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

    const hasSmtpConfiguration =
      Boolean(env.SMTP_HOST) &&
      Boolean(env.SMTP_USER) &&
      Boolean(env.SMTP_PASSWORD);

    if (env.NODE_ENV !== 'production') {
      this.testOtpRegistry.set(normalizedEmail, otp);
    }

    /*
     * Use SMTP whenever SMTP credentials exist.
     * NODE_ENV does not prevent email delivery.
     */
    if (hasSmtpConfiguration) {
      const transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_PORT === 465,
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASSWORD,
        },
      });

      const displayName = userName?.trim() || 'there';
      const fromAddress = env.SMTP_FROM || env.SMTP_USER;

      await transporter.sendMail({
        from: fromAddress,
        to: normalizedEmail,
        subject: 'Your DMetrics email verification code',
        text: [
          `Hello ${displayName},`,
          '',
          `Your DMetrics verification code is: ${otp}`,
          '',
          'This code expires in 10 minutes and can only be used once.',
          '',
          'If you did not create a DMetrics account, you can ignore this email.',
        ].join('\n'),
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #172033;">
            <h2>Verify your DMetrics email</h2>
            <p>Hello ${displayName},</p>
            <p>Your DMetrics verification code is:</p>

            <div style="
              display: inline-block;
              padding: 12px 20px;
              margin: 12px 0;
              border-radius: 8px;
              background: #eef2ff;
              color: #3730a3;
              font-size: 28px;
              font-weight: 700;
              letter-spacing: 6px;
            ">
              ${otp}
            </div>

            <p>This code expires in 10 minutes and can only be used once.</p>
            <p>If you did not create a DMetrics account, you can ignore this email.</p>
          </div>
        `,
      });

      console.log(
        `[EmailService] Verification email sent to ${normalizedEmail}`
      );

      return;
    }

    /*
     * Development fallback when SMTP is not configured.
     */
    if (env.NODE_ENV !== 'production') {
      console.warn(
        '[EmailService] SMTP is not configured. OTP is available only in the backend terminal.'
      );
      console.log(`[EmailService: DEV ONLY] Recipient: ${normalizedEmail}`);
      console.log(`[EmailService: DEV ONLY] OTP: ${otp}`);
      console.log('[EmailService: DEV ONLY] OTP expires in 10 minutes.');

      return;
    }

    /*
     * Never silently continue in production without email delivery.
     */
    throw new Error(
      'Email delivery is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, and SMTP_FROM.'
    );
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