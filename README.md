# pele-mele-vinyls

Fetches new vinyls from the Pele Mele website, filters for interesting ones
with OpenAI, and notifies you in Discord. It runs as a Cloudflare Worker every
three hours and also supports an authenticated manual run.

## Setup

1. Install Node.js and dependencies:

   ```sh
   pnpm install
   ```

2. Create a Cloudflare KV namespace and copy the returned ID into
   `wrangler.jsonc` in place of `REPLACE_WITH_KV_NAMESPACE_ID`:

   ```sh
   npx wrangler kv namespace create PELE_MELE_KV
   ```

3. Configure the required secrets:

   ```sh
   npx wrangler secret put WEBHOOK_ID
   npx wrangler secret put WEBHOOK_TOKEN
   npx wrangler secret put OPENAI_BEARER
   npx wrangler secret put MANUAL_TRIGGER_TOKEN
   ```

   For local development, copy `.dev.vars.example` to `.dev.vars` and fill in
   the same values.

4. Authenticate and deploy:

   ```sh
   npx wrangler login
   pnpm run deploy
   ```

The Worker runs on the `0 */3 * * *` schedule. To run it manually, send an
authenticated `POST` request to `/run` on the Worker URL:

```sh
curl -X POST \
  -H "Authorization: Bearer $MANUAL_TRIGGER_TOKEN" \
  https://pele-mele-vinyls.<your-subdomain>.workers.dev/run
```

Use `pnpm run dev` to run the Worker locally and `pnpm run typecheck` to check
the TypeScript types.
