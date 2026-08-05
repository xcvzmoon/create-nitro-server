import { mockEvent } from 'h3';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import authCatchAllHandler from '~/server/routes/api/v1/auth/[...all].ts';

const { authHandlerMock } = vi.hoisted(() => ({ authHandlerMock: vi.fn() }));

vi.mock('~/server/utils/auth.ts', () => ({
  auth: { handler: authHandlerMock },
}));

beforeEach(() => {
  authHandlerMock.mockReset();
});

describe('ANY /api/v1/auth/**', () => {
  it('forwards the raw request to the better-auth handler', async () => {
    const expectedResponse = Response.json({ ok: true });
    authHandlerMock.mockResolvedValue(expectedResponse);
    const event = mockEvent('http://localhost/api/v1/auth/sign-in', { method: 'POST' });

    const response = await authCatchAllHandler(event);

    expect(authHandlerMock).toHaveBeenCalledWith(event.req);
    expect(response).toBe(expectedResponse);
  });
});
