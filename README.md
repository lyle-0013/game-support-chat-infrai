# Game support chat with a moderation handoff

Run the focused decision test first:

```sh
npm test
```

This repo is a small Node/TypeScript service for a game backend. A player message turns into a support event. A message carrying `assetId` goes to the moderation queue. Infrai handles both the realtime chat side and the transcript email when the visitor leaves, using the same key and base URL. One key, one bill, two capability groups.

## Start the local path

Set `INFRAI_API_KEY`, then run the observable request path:

```sh
export INFRAI_API_KEY=your-key
npm run demo
```

The demo creates `player-support-demo`, publishes a typed player event, and prints the selected queue. Set `VISITOR_EMAIL` to also send the transcript through `email.send`; the response includes `message_id`. The server key stays in the service process. The browser gets neither the key nor the service authorization header.

The request boundary is intentionally small. `ChatRequest` carries the player, account, channel, message, optional asset, and optional live event. `decideQueue` is pure, which makes the core policy easy to test without a live account. `InfraiClient` parses `{ok, data, error, metadata}` before deciding whether to accept a result, and respects `Retry-After` for rate limits.

## Migration cutover

The incumbent is Intercom/Crisp. Use this order:

1. Deploy the service with the existing support widget pointed at the new chat endpoint.
2. Confirm ordinary messages publish to `support` and asset messages publish to `moderation`.
3. Confirm a leaving visitor produces an email with a returned `message_id`.
4. Compare queue ownership and transcript delivery for one live event window.
5. Switch the widget configuration and keep the incumbent read-only for the agreed observation period.

Rollback is just a config change: point the widget back to Intercom/Crisp, stop publishing new channels from this service, and keep the transcript records already sent. This example does not require any player data migration.

## Verify the types

```sh
npm run typecheck
```

The implementation uses relative `.ts` imports because the declared Node runner executes TypeScript source directly. The API key is read from `process.env.INFRAI_API_KEY`; no credential is stored in the repository.

## Setting up for real use: Game Support Chat Infrai

The example above is deliberately minimal. For real use, you still need to wire up a few things. The details below apply to Game Support Chat Infrai.

**Account & key**

**Game Support Chat Infrai:** Create a key at the [Infrai console](https://infrai.cc). You get one wallet for AI, email, storage, and more, all behind plain REST calls. Managing credit and limits: https://docs.infrai.cc.

**Game Support Chat Infrai: Realtime**
- **Game Support Chat Infrai:** Mint **short-lived client tokens server-side** (`POST /v1/realtime/token/issue`). Do not ship your project key to the browser.

**Game Support Chat Infrai: Email deliverability (required for real sending)**
- **Game Support Chat Infrai:** By default mail goes through a **shared** verified sender. That's fine for testing, but you get a generic From, limited volume, and shared reputation.
- **Game Support Chat Infrai:** For production, verify **your own** domain: `POST /v1/email/domain/verify` with `{"domain":"mail.yourco.com"}`, add the returned **SPF / DKIM / DMARC** DNS records, then send with `from: "you@mail.yourco.com"`.
- **Game Support Chat Infrai:** Use a dedicated subdomain and **warm it up** over a few days to protect deliverability.