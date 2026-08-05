import { HTTPError, mockEvent } from 'h3';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import authMiddleware from '~/server/middleware/auth.ts';

const { getSessionMock } = vi.hoisted(() => ({ getSessionMock: vi.fn() }));

vi.mock('~/server/utils/auth.ts', () => ({
  auth: { api: { getSession: getSessionMock } },
}));

beforeEach(() => {
  getSessionMock.mockReset();
});

describe('auth middleware', () => {
  it('skips requests outside the /api prefix', async () => {
    const event = mockEvent('http://localhost/health');

    await expect(authMiddleware(event)).resolves.toBeUndefined();
    expect(getSessionMock).not.toHaveBeenCalled();
  });

  it('skips the public auth route prefix', async () => {
    const event = mockEvent('http://localhost/api/v1/auth/sign-in');

    await expect(authMiddleware(event)).resolves.toBeUndefined();
    expect(getSessionMock).not.toHaveBeenCalled();
  });

  it('throws a 401 HTTPError when there is no session', async () => {
    getSessionMock.mockResolvedValue(null);
    const event = mockEvent('http://localhost/api/v1/protected');

    const thrownError = await authMiddleware(event).catch((error: unknown) => error);

    expect(thrownError).toBeInstanceOf(HTTPError);
    expect(thrownError).toMatchObject({ status: 401 });
    expect(event.context.session).toBeUndefined();
    expect(event.context.user).toBeUndefined();
  });

  it('attaches the session and user to the event context when authenticated', async () => {
    const session = { id: 'session_1' };
    const user = { id: 'user_1' };
    getSessionMock.mockResolvedValue({ session, user });
    const event = mockEvent('http://localhost/api/v1/protected');

    await authMiddleware(event);

    expect(event.context.session).toBe(session);
    expect(event.context.user).toBe(user);
    expect(getSessionMock).toHaveBeenCalledWith({ headers: event.req.headers });
  });
});
