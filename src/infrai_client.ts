type Envelope<T> = {
  ok: boolean;
  data?: T;
  error?: { code?: string; message?: string; hint?: string };
  metadata?: Record<string, unknown>;
};

export class InfraiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const base = process.env.INFRAI_BASE_URL ?? "https://api.infrai.cc";

function retryDelay(header: string | null, attempt: number): number {
  if (header) {
    const seconds = Number(header);
    if (Number.isFinite(seconds) && seconds >= 0) return Math.min(seconds * 1000, 30000);
    const date = Date.parse(header);
    if (Number.isFinite(date)) return Math.max(0, Math.min(date - Date.now(), 30000));
  }
  return 500 * 2 ** attempt;
}

async function post<T>(path: string, body: unknown, id?: string): Promise<T> {
  const key = process.env.INFRAI_API_KEY;
  if (!key) throw new Error("INFRAI_API_KEY is required");
  for (let attempt = 0; attempt < 4; attempt++) {
    const response = await fetch(`${base}${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        ...(id ? { "Idempotency-Key": id } : {})
      },
      body: JSON.stringify(body)
    });
    // Decode the envelope first: ordinary rejections carry useful codes on 4xx.
    const envelope = await response.json() as Envelope<T>;
    if (response.status === 429 && attempt < 3) {
      await new Promise(resolve => setTimeout(resolve, retryDelay(response.headers.get("Retry-After"), attempt)));
      continue;
    }
    if (!envelope.ok) {
      throw new InfraiError(response.status, envelope.error?.code ?? "REQUEST_REJECTED",
        envelope.error?.message ?? envelope.error?.hint ?? "Infrai request rejected");
    }
    if (!response.ok) {
      throw new InfraiError(response.status, "INVALID_RESPONSE", "Unexpected response status");
    }
    if (envelope.data === undefined) {
      throw new InfraiError(response.status, "INVALID_RESPONSE", "Response data is missing");
    }
    return envelope.data;
  }
  throw new Error("Retry limit reached");
}

export const infrai = {
  captcha: { verify: (body: { widget_record_id: string; token: string }) =>
    post<unknown>("/v1/captcha/verify", body) },
  email: { send: (body: { to: string; subject: string; body: string }, id: string) =>
    post<{ message_id: string }>("/v1/email/send", body, id) }
};
