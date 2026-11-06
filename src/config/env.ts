import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z
  .object({
    PORT: z.string().default('5000').transform(Number),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    DATABASE_URL: z.string().default('file:./dev.db'),
    JWT_SECRET: z
      .string({ required_error: 'JWT_SECRET environment variable is required' })
      .min(32, 'JWT_SECRET must be at least 32 characters long for cryptographic security')
      .default(
        process.env.NODE_ENV === 'production'
          ? (undefined as any)
          : 'supersecret_jwt_eventwave_vendor_token_2026_key'
      ),
    JWT_EXPIRES_IN: z.string().default('7d'),
    OTP_EXPIRY_MINUTES: z.string().default('5').transform(Number),
    MOCK_SMS_PROVIDER: z
      .string()
      .default('true')
      .transform((val) => val.toLowerCase() === 'true'),
    MOCK_KYC_MODE: z
      .string()
      .default('true')
      .transform((val) => val.toLowerCase() === 'true'),
  })
  .refine(
    (data) => {
      // In production mode, mock SMS and mock KYC must be explicitly disabled
      if (data.NODE_ENV === 'production') {
        return !data.MOCK_SMS_PROVIDER && !data.MOCK_KYC_MODE;
      }
      return true;
    },
    {
      message: 'CRITICAL SECURITY ERROR: MOCK_SMS_PROVIDER and MOCK_KYC_MODE must be false in production',
    }
  );

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Invalid environment variables:', parsedEnv.error.format());
  process.exit(1);
}

export const env = parsedEnv.data;
