import assert from "node:assert/strict";
import { sessionsToSignOut } from "./session_policy.js";
import { InfraiClient } from "./infrai_client.js";
const sessions = [{ session_id: "checkout-laptop" }, { session_id: "volunteer-phone" }, { session_id: "office-tablet" }];
assert.deepEqual(sessionsToSignOut(sessions, "checkout-laptop").map((s) => s.session_id), ["volunteer-phone", "office-tablet"]);
const originalFetch = globalThis.fetch;
const originalKey = process.env.INFRAI_API_KEY;
try {
  process.env.INFRAI_API_KEY = "test-key";
  globalThis.fetch = async () => new Response(JSON.stringify({ ok: true, data: { items: sessions } }), { status: 200 });
  assert.deepEqual(await new InfraiClient().listSessions("donor-42"), sessions);
} finally {
  globalThis.fetch = originalFetch;
  if (originalKey === undefined) delete process.env.INFRAI_API_KEY;
  else process.env.INFRAI_API_KEY = originalKey;
}
console.log("session policy keeps the current checkout session and selects the other devices");
