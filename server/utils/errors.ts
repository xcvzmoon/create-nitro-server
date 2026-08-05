import { Schema } from 'effect';

// oxlint-disable-next-line throw-new-error -- false positive: no `throw` here, this constructs a Schema.TaggedError class
export class MailError extends Schema.TaggedError<MailError>('MailError')('MailError', {
  template: Schema.String,
  to: Schema.String,
  cause: Schema.Unknown,
}) {}
