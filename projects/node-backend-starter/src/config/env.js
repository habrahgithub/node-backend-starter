import { z } from "zod";

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).optional(),
    PORT: z.string().optional(),
    JWT_SECRET: z.string().optional(),
  })
  .transform((env) => {
    const portRaw = env.PORT ?? "";
    const port = portRaw === "" ? 3000 : Number.parseInt(portRaw, 10);

    return {
      nodeEnv: env.NODE_ENV ?? "development",
      port,
      jwtSecret: env.JWT_SECRET,
    };
  })
  .superRefine((env, ctx) => {
    if (!Number.isInteger(env.port) || env.port < 1 || env.port > 65535) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["PORT"],
        message: "PORT must be an integer between 1 and 65535",
      });
    }

    if (env.nodeEnv === "production" && !env.jwtSecret) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["JWT_SECRET"],
        message: "JWT_SECRET is required in production",
      });
    }
  });

export const validateEnv = (env) => envSchema.safeParse(env);

export const loadEnv = () => {
  const result = validateEnv(process.env);
  if (!result.success) {
    console.error("Invalid environment configuration:");
    for (const issue of result.error.issues) {
      console.error(`- ${issue.path.join(".")}: ${issue.message}`);
    }
    process.exit(1);
  }

  return result.data;
};
