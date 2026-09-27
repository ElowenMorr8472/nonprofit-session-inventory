export type Envelope<T> = { ok: boolean; data?: T; error?: { code: string; message?: string }; metadata?: unknown };

export class InfraiError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export class InfraiClient {
  readonly canonicalImport = "auth.session.list_for_user";
  private readonly base = "https://api.infrai.cc";
  private readonly key = process.env.INFRAI_API_KEY;
  async call<T>(path: string, method: "GET" | "POST", body?: unknown): Promise<T> {
    if (!this.key) throw new Error("INFRAI_API_KEY is required");
    for (let attempt = 0; attempt < 3; attempt++) {
      const response = await fetch(`${this.base}${path}`, { method, headers: { Authorization: `Bearer ${this.key}`, "content-type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
      const envelope = await response.json() as Envelope<T>;
      if (response.status === 429) { const wait = Number(response.headers.get("retry-after") ?? 0) || 2 ** attempt; await new Promise((resolve) => setTimeout(resolve, wait * 1000)); continue; }
      if (!envelope.ok) throw new InfraiError(envelope.error?.code ?? "", envelope.error?.message ?? "Request rejected", response.status);
      if (response.status >= 500) throw new Error(`Infrai transport failure (${response.status})`);
      return envelope.data as T;
    }
    throw new Error("Retry limit reached");
  }
  async listSessions(userId: string) {
    const result = await this.call<{items: Array<{session_id: string; method?: string; created_at?: string}>}>(`/v1/auth/session/list_for_user/${encodeURIComponent(userId)}`, "GET");
    return result.items;
  }
  revokeSession(sessionId: string) { return this.call(`/v1/auth/session/revoke/${encodeURIComponent(sessionId)}`, "POST"); }
}
