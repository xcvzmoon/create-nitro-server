import { dymoEmailPlugin } from '@dymo-api/better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { betterAuth } from 'better-auth/minimal';
import { Effect, Redacted } from 'effect';
import { v7 as uuidV7 } from 'uuid';
import { db } from '../database/index.ts';
import { accounts, sessions, users, verifications } from '../database/schema.ts';
import { getAppConfig } from './config.ts';
import { Mail, runMail } from './mail.ts';

export type AuthSession = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;

declare module 'h3' {
  interface H3EventContext {
    session?: AuthSession['session'];
    user?: AuthSession['user'];
  }
}

const appConfig = getAppConfig();

const EMAIL_VERIFICATION_EXPIRES_IN_SECONDS = 60 * 60;
const RESET_PASSWORD_EXPIRES_IN_SECONDS = 60 * 60;

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      account: accounts,
      session: sessions,
      user: users,
      verification: verifications,
    },
  }),
  advanced: {
    database: {
      generateId: () => uuidV7(),
    },
  },
  emailAndPassword: {
    enabled: true,
    resetPasswordTokenExpiresIn: RESET_PASSWORD_EXPIRES_IN_SECONDS,
    sendResetPassword: async ({ user, url }) => {
      await runMail(
        Effect.gen(function* sendResetPasswordEmail() {
          const mail = yield* Mail;
          yield* mail.sendTemplated({
            to: user.email,
            subject: `Reset your ${appConfig.appName} password`,
            preheader: 'Use this link to reset your password.',
            template: 'reset-password',
            vars: {
              appName: appConfig.appName,
              name: user.name,
              url,
              expiresInMinutes: RESET_PASSWORD_EXPIRES_IN_SECONDS / 60,
            },
          });
        }),
      );
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    expiresIn: EMAIL_VERIFICATION_EXPIRES_IN_SECONDS,
    sendVerificationEmail: async ({ user, url }) => {
      await runMail(
        Effect.gen(function* sendVerificationEmailEffect() {
          const mail = yield* Mail;
          yield* mail.sendTemplated({
            to: user.email,
            subject: `Verify your email for ${appConfig.appName}`,
            preheader: 'Confirm your email to finish setting up your account.',
            template: 'verify-email',
            vars: {
              appName: appConfig.appName,
              name: user.name,
              url,
              expiresInMinutes: EMAIL_VERIFICATION_EXPIRES_IN_SECONDS / 60,
            },
          });
        }),
      );
    },
  },
  socialProviders: {
    google: {
      clientId: appConfig.google.clientId,
      clientSecret: Redacted.value(appConfig.google.clientSecret),
    },
  },
  plugins: [
    dymoEmailPlugin({
      apiKey: Redacted.value(appConfig.dymo.apiKey),
      applyToOAuth: true,
      emailRules: { deny: ['FRAUD', 'INVALID', 'NO_REPLY_EMAIL'] },
    }),
  ],
  basePath: '/api/v1/auth',
});
