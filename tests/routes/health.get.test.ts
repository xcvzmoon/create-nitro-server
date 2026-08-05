import { describe, expect, it } from 'vitest';
import healthHandler from '~/server/routes/health.get.ts';

describe('GET /health', () => {
  it('responds with a 200 status and an ok payload', async () => {
    const response = await healthHandler.fetch('http://localhost/health');

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ status: 'ok' });
  });
});
