import { createServer } from "node:http";
import { z } from "zod";
import { InfraiClient } from "./infrai_client.js";
import { sessionsToSignOut } from "./session_policy.js";

const input = z.object({ user_id: z.string().min(1), current_session_id: z.string().min(1), sign_out_others: z.boolean().default(false) });
const client = new InfraiClient();
const server = createServer(async (req, res) => {
  if (req.method !== "POST" || req.url !== "/session-inventory") { res.writeHead(404).end(); return; }
  try {
    const chunks: Buffer[] = []; for await (const chunk of req) chunks.push(chunk as Buffer);
    const parsed = input.parse(JSON.parse(Buffer.concat(chunks).toString("utf8")));
    const sessions = await client.listSessions(parsed.user_id);
    const others = sessionsToSignOut(sessions, parsed.current_session_id);
    if (parsed.sign_out_others) await Promise.all(others.map((s) => client.revokeSession(s.session_id)));
    res.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify({ user_id: parsed.user_id, active_sessions: sessions.length, signed_out: parsed.sign_out_others ? others.length : 0 }));
  } catch (error) { const status = error instanceof z.ZodError ? 400 : error instanceof Error && "status" in error && Number(error.status) < 500 ? Number((error as {status:number}).status) : 500; res.writeHead(status, { "content-type": "application/json" }).end(JSON.stringify({ error: error instanceof Error ? error.message : "Request failed" })); }
});
server.listen(Number(process.env.PORT ?? 3000), () => console.log("session inventory listening"));
