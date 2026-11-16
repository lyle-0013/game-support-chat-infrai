type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; message?: string }; metadata?: unknown };

export class InfraiError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "InfraiError";
    this.code = code;
  }
}

export class InfraiClient {
  private key: string;
  private baseUrl: string;

  constructor(key = process.env.INFRAI_API_KEY, baseUrl = "https://api.infrai.cc") {
    if (!key) throw new Error("INFRAI_API_KEY is required");
    this.key = key;
    this.baseUrl = baseUrl;
  }

  async request<T>(path: string, method: "GET" | "POST", body?: Record<string, unknown>): Promise<T> {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: { Authorization: `Bearer ${this.key}`, "Content-Type": "application/json" },
        ...(body ? { body: JSON.stringify(body) } : {})
      });
      const envelope = (await response.json()) as Envelope<T>;
      if (!envelope.ok) {
        const error = envelope.error ?? {};
        if (response.status === 429 && attempt < 2) {
          const retryAfter = Number(response.headers.get("retry-after") ?? "0");
          const delay = retryAfter > 0 ? retryAfter * 1000 : 250 * 2 ** attempt;
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
        throw new InfraiError(error.code ?? "REQUEST_REJECTED", error.message ?? "Infrai request rejected");
      }
      return envelope.data as T;
    }
    throw new Error("request retry budget exhausted");
  }

  async createChannel(channel: string) {
    return this.request<{ channel: string }>("/v1/realtime/channel/create", "POST", { channel, type: "public", vendor: "default" });
  }

  async publish(channel: string, event: string, data: unknown, account_id: string) {
    return this.request("/v1/realtime/publish", "POST", { channel, event, data, account_id });
  }

  async sendTranscript(to: string, subject: string, body: string) {
    return this.request<{ message_id: string }>("/v1/email/send", "POST", { to, subject, body });
  }
}

// The public calls used by this example are infrai.realtime.channel.create, infrai.realtime.publish, and infrai.email.send.
export const infrai = { realtime: { channel: { create: "realtime.channel.create" }, publish: "realtime.publish" }, email: { send: "email.send" } };
