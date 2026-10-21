// Vercel Function: the save in the cloud. Everything it does is in server/sync.js; the settings are
// environment variables on the Vercel project (docs/sync.md): TURSO_DATABASE_URL, TURSO_AUTH_TOKEN,
// SYNC_PASSWORD and, optionally, SYNC_ORIGINS.

import { handle, fromEnv } from '../server/sync.js';

const config = fromEnv();

export default {
  async fetch(request) {
    return handle(request, await config);
  },
};
