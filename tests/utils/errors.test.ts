import { describe, expect, it } from 'vitest';
import { MailError } from '~/server/utils/errors.ts';

describe('MailError', () => {
  it('carries the template, recipient, and cause of a failed send', () => {
    const cause = new Error('smtp timeout');
    const error = new MailError({ template: 'verify-email', to: 'user@example.com', cause });

    expect(error._tag).toBe('MailError');
    expect(error.template).toBe('verify-email');
    expect(error.to).toBe('user@example.com');
    expect(error.cause).toBe(cause);
  });

  it('is throwable as a standard Error', () => {
    const error = new MailError({
      template: 'reset-password',
      to: 'user@example.com',
      cause: undefined,
    });

    expect(error).toBeInstanceOf(Error);
    expect(() => {
      throw error;
    }).toThrow(error);
  });
});
