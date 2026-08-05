import { Cause, Effect } from 'effect';
import { definePlugin } from 'nitro';
import { appConfigSchema, getAppConfig, setAppConfig } from '../utils/config.ts';

export default definePlugin(() => {
  const result = Effect.runSyncExit(appConfigSchema);
  if (result._tag === 'Failure') throw new Error(Cause.pretty(result.cause));

  setAppConfig(result.value);
  getAppConfig();
});
