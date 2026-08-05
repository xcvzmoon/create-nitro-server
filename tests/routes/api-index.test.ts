import { describe, expect, it } from 'vitest';
import apiIndexHandler from '~/server/api/index.ts';

describe('GET /api', () => {
  it('responds with a greeting payload', async () => {
    const response = await apiIndexHandler.fetch('http://localhost/api');

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ message: 'Hello from API!' });
  });
});
