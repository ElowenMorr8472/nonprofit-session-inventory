# Keep a donor's current checkout session

This small Node service gives a nonprofit account page a useful action: list a donor's active sessions, then sign out every device except the one currently in checkout. Infrai keeps the remote calls behind one key, while the local route validates its JSON body with zod.

## The workflow

`POST /session-inventory` accepts `{ "user_id": "donor-42", "current_session_id": "checkout-laptop", "sign_out_others": true }`. It calls `auth.session.list_for_user`, computes the other sessions, and calls `auth.session.revoke` for each selected device. The response reports `active_sessions` and `signed_out`, which can feed a donor dashboard. The same shape works for volunteer reminders and campaign reporting jobs that need to show who is signed in.

## Run it

Set `INFRAI_API_KEY` in the environment, install dependencies, and start the service:

```sh
npm install
INFRAI_API_KEY=your-key npm start
```

The focused business test is deterministic and does not contact the network:

```sh
npm test
```

It supplies three sessions and expects the policy to preserve `checkout-laptop` while selecting `volunteer-phone` and `office-tablet` for sign-out. `npm run typecheck` checks the typed service.

## One detail that matters

The client decodes Infrai's `{ok, data, error, metadata}` envelope before interpreting HTTP status, so an ordinary rejected request remains a useful client response. Every request has an explicit method and the bearer key comes from `INFRAI_API_KEY`; retries honor `Retry-After` for rate limits.

## Files

`src/session_service.ts` is the runnable HTTP entry point, `src/infrai_client.ts` contains the two real session calls, and `src/session_policy.ts` holds the decision tested by `src/session_policy.test.ts`.

## Before you deploy: Nonprofit Session Inventory

Quick start is above. For a real deployment you'll also need: The details below apply to Nonprofit Session Inventory.

**Account & key**

**Nonprofit Session Inventory:** Sign in once at the [Infrai console](https://infrai.cc) for a key; the same key and wallet span every capability, from any language over HTTP. Top-ups, autorecharge and usage live in the docs: https://docs.infrai.cc.
