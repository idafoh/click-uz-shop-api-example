import z from 'zod';

export const ENV_SCHEMA = z.object({
  SECRET_KEY: z.string(),
  DATABASE_URL: z.string(),
});

type Env = z.infer<typeof ENV_SCHEMA>;

declare global {
  namespace NodeJS {
    interface ProcessEnv extends Env { }
  }
}
