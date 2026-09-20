import dns from 'node:dns';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import nodemailer, { type TransportOptions } from 'nodemailer';
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

    // Log OTP to server console as an immediate backup for environments where SMTP is blocked (e.g., Render Free Tier)
    console.log(`\n======================================================`);
    console.log(`[EmailService] ✉️  Verification OTP for ${normalizedEmail}: ${otp}`);
    console.log(`======================================================\n`);

    const hasSmtpConfiguration =
      Boolean(env.SMTP_HOST) &&
      Boolean(env.SMTP_USER) &&
      Boolean(env.SMTP_PASSWORD);

    if (env.NODE_ENV !== 'production') {
      this.testOtpRegistry.set(normalizedEmail, otp);
    }

    /*
     * Use SMTP whenever SMTP credentials exist.
     */
    if (hasSmtpConfiguration) {
      let targetHost = env.SMTP_HOST;
      try {
        // Force IPv4 resolution to prevent ENETUNREACH in cloud environments (Render) without IPv6 routes
        const addresses = await dns.promises.resolve4(env.SMTP_HOST);
        if (addresses && addresses.length > 0) {
          targetHost = addresses[0];
        }
      } catch (dnsErr) {
        console.warn(
          `[EmailService] Could not resolve IPv4 for ${env.SMTP_HOST}, using hostname directly:`,
          dnsErr
        );
      }

      const transporter = nodemailer.createTransport({
        host: targetHost,
        port: env.SMTP_PORT,
        secure: env.SMTP_PORT === 465,
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASSWORD,
        },
        tls: {
          servername: env.SMTP_HOST,
        },
        family: 4,
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
      } as TransportOptions);

      const displayName = userName?.trim() || 'there';
      const fromAddress = env.SMTP_FROM || env.SMTP_USER;

      try {
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
      } catch (sendError) {
        console.error(
          `[EmailService] SMTP delivery failed for ${normalizedEmail}:`,
          sendError
        );
        console.warn(
          `[EmailService: ACTION REQUIRED] If using Render Free Tier, note that Render blocks outbound SMTP ports (25, 465, 587). Use the console OTP above (${otp}) to verify.`
        );
        throw sendError;
      }
    }

    /*
     * Fallback when SMTP is not configured.
     */
    console.warn(
      '[EmailService] SMTP is not configured. OTP is available only in the backend terminal.'
    );
    console.log(`[EmailService: BACKEND ONLY] Recipient: ${normalizedEmail}`);
    console.log(`[EmailService: BACKEND ONLY] OTP: ${otp}`);
    console.log('[EmailService: BACKEND ONLY] OTP expires in 10 minutes.');
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