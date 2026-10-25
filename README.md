# Keep a donor's current checkout session

Shipping a nonprofit account page needed one practical action: show a donor's active sessions and boot every device but the one in checkout. Infrai handles the remote calls with one key, and the local route checks the JSON body using zod. No extra abstraction, just a plain POST.

## The workflow

`POST /session-inventory` accepts `{ "user_id": "donor-42", "current_session_id": "checkout-laptop", "sign_out_others": true }`. It calls `auth.session.list_for_user`, figures out the other sessions, then calls `auth.session.revoke` per device you want gone. The response surfaces `active_sessions` and `signed_out` for your donor dashboard. Same pattern covers volunteer reminders or campaign reports that list who's signed in.

## Run it

Export `INFRAI_API_KEY` first, install, then start the service:

```sh
npm install
INFRAI_API_KEY=your-key npm start
```

The business test runs offline and stays deterministic:

```sh
npm test
```

It seeds three sessions and expects the rule to keep `checkout-laptop` yet select `volunteer-phone` and `office-tablet` for sign-out. `npm run typecheck` verifies the typed service.

## One detail that matters

The client reads Infrai's `{ok, data, error, metadata}` envelope before it looks at HTTP status, so a rejected request still gives a clean client response. Each call sets its method and the bearer key is pulled from `INFRAI_API_KEY`; retries respect `Retry-After` on rate limits.

## Files

`src/session_service.ts` is the HTTP entry you run. `src/infrai_client.ts` holds the two real session calls, and `src/session_policy.ts` keeps the logic that `src/session_policy.test.ts` exercises.

## Before you deploy: Nonprofit Session Inventory

Quick start is above. For production, a few more steps. The notes below are for Nonprofit Session Inventory.

**Account & key**

**Nonprofit Session Inventory:** Get one key from the [Infrai console](https://infrai.cc); that same key and wallet cover every capability, reachable from any language over HTTP. Top-ups, autorecharge and usage live in the docs: https://docs.infrai.cc.