import { Cause, Context, Effect, Exit, Layer, ManagedRuntime, Option, Redacted } from 'effect';
import { useStorage } from 'nitro/storage';
import { createEmail, withRender } from 'unemail';
import smtp from 'unemail/driver/smtp';
import { withLogger, withRetry } from 'unemail/middleware';
import { handlebarsRenderer } from 'unemail/render/handlebars';
import { htmlPipeline, withPreheader } from 'unemail/render/pipeline';
import { getAppConfig } from './config.ts';
import { MailError } from './errors.ts';

export type SendTemplatedMailOptions = {
  to: string;
  subject: string;
  preheader?: string;
  template: string;
  vars: Record<string, unknown>;
};

export class Mail extends Context.Tag('Mail')<
  Mail,
  {
    readonly sendTemplated: (options: SendTemplatedMailOptions) => Effect.Effect<void, MailError>;
  }
>() {}

const MailLive = Layer.effect(
  Mail,
  Effect.sync(() => {
    const appConfig = getAppConfig();

    const driver = withRetry(
      smtp({
        host: appConfig.mail.host,
        port: appConfig.mail.port,
        secure: appConfig.mail.secure,
        user: appConfig.mail.user,
        password: Redacted.value(appConfig.mail.password),
      }),
      {
        retries: 3,
        backoff: 'full-jitter',
      },
    );

    const client = createEmail({ driver })
      .use(withRender(handlebarsRenderer()))
      .use(htmlPipeline(withPreheader()))
      .use(withLogger({ redactLocalPart: appConfig.nodeEnv === 'production' }));

    const templateCache = new Map<string, string>();

    const loadTemplate = (name: string) =>
      Effect.gen(function* loadTemplateEffect() {
        const cached = templateCache.get(name);
        if (cached) return cached;

        const source = yield* Effect.tryPromise({
          try: async () => useStorage('assets:emails').getItem(`${name}.hbs`),
          catch: (cause) => new MailError({ template: name, to: '', cause }),
        });

        if (typeof source !== 'string') {
          return yield* Effect.fail(
            new MailError({
              template: name,
              to: '',
              cause: new Error(`Email template "${name}" was not found in server assets`),
            }),
          );
        }

        templateCache.set(name, source);
        return source;
      });

    return {
      sendTemplated: (options: SendTemplatedMailOptions) =>
        Effect.gen(function* sendTemplatedEffect() {
          const handlebarsSource = yield* loadTemplate(options.template);

          const result = yield* Effect.tryPromise({
            try: async () =>
              client.send({
                from: appConfig.mail.from,
                to: options.to,
                subject: options.subject,
                preheader: options.preheader,
                handlebars: handlebarsSource,
                handlebarsVars: options.vars,
              }),
            catch: (cause) => {
              return new MailError({
                template: options.template,
                to: options.to,
                cause,
              });
            },
          });

          if (result.error) {
            yield* Effect.fail(
              new MailError({
                template: options.template,
                to: options.to,
                cause: result.error,
              }),
            );
          }
        }),
    };
  }),
);

const mailRuntime = ManagedRuntime.make(MailLive);

export async function runMail<A>(effect: Effect.Effect<A, MailError, Mail>): Promise<A> {
  const exit = await mailRuntime.runPromiseExit(effect);
  if (Exit.isSuccess(exit)) return exit.value;

  const failure = Cause.failureOption(exit.cause);
  if (Option.isSome(failure)) {
    throw new Error(`Failed to send "${failure.value.template}" email to ${failure.value.to}`, {
      cause: failure.value.cause,
    });
  }

  throw new Error('Unexpected failure while sending email', { cause: Cause.squash(exit.cause) });
}
