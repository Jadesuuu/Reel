import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  COOKIE_SECURE: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
  WEB_ORIGIN: z.string().url().default('http://localhost:3000'),
  HN_ALGOLIA_BASE: z.string().url().default('https://hn.algolia.com/api/v1'),
  HN_FIREBASE_BASE: z
    .string()
    .url()
    .default('https://hacker-news.firebaseio.com/v0'),
  STALE_AFTER_DAYS: z.coerce.number().int().positive().default(10),
  STALE_DELAY_MS: z.coerce.number().int().positive().optional(),
  MAILER: z.enum(['console', 'resend']).default('console'),
  RESEND_API_KEY: z.string().optional(),
  MAIL_FROM: z.string().default('Reel <reel@jadebonifacio.dev>'),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid environment variables:\n${issues}`);
  }
  if (parsed.data.MAILER === 'resend' && !parsed.data.RESEND_API_KEY) {
    throw new Error(
      'Invalid environment variables:\n  - RESEND_API_KEY: required when MAILER=resend',
    );
  }
  return parsed.data;
}
