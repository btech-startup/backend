import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('5000').transform(Number),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().default('file:./dev.db'),
  JWT_SECRET: z.string().default('supersecret_jwt_eventwave_vendor_token_2026_key'),
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
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Invalid environment variables:', parsedEnv.error.format());
  process.exit(1);
}

export const env = parsedEnv.data;
