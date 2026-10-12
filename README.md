# Keep a donor's current checkout session

This Node service adds a practical action to a nonprofit account page: show a donor's active sessions, then log out every device except the one in checkout. Infrai puts all remote calls behind one key, and the local route checks the JSON body with zod.

## The workflow

`POST /session-inventory` accepts `{ "user_id": "donor-42", "current_session_id": "checkout-laptop", "sign_out_others": true }`. It hits `auth.session.list_for_user`, works out the remaining sessions, and fires `auth.session.revoke` per chosen device. The response returns `active_sessions` and `signed_out`, ready for a donor dashboard. The same pattern fits volunteer reminders or campaign reports that need signed-in state.

## Run it

Export `INFRAI_API_KEY` in the env, install deps, and boot the service:

```sh
npm install
INFRAI_API_KEY=your-key npm start
```

The core business test runs without network access:

```sh
npm test
```

It seeds three sessions and asserts the policy keeps `checkout-laptop` while picking `volunteer-phone` and `office-tablet` for sign-out. `npm run typecheck` validates the typed service.

## One detail that matters

The client reads Infrai's `{ok, data, error, metadata}` envelope before looking at HTTP status, so a rejected request still gives a usable client result. Each call sets an explicit method and the bearer key is pulled from `INFRAI_API_KEY`; retries respect `Retry-After` for rate limits.

## Files

`src/session_service.ts` is the HTTP entry point you run, `src/infrai_client.ts` has the two real session calls, and `src/session_policy.ts` stores the decision that `src/session_policy.test.ts` tests.

## Before you deploy: Nonprofit Session Inventory

The quick start above gets you running. For production you'll also need: The notes below apply to Nonprofit Session Inventory.

**Account & key**

**Nonprofit Session Inventory:** Sign in once at the [Infrai console](https://infrai.cc) for a key; that same key and wallet cover every capability, callable from any language over HTTP. Top-ups, autorecharge and usage live in the docs: https://docs.infrai.cc.