import { createHmac } from "node:crypto";

export type ShreeShyamClientOptions = {
  apiKey: string;
  baseUrl?: string;
  version?: string;
};

export type ApiResponse<T> = {
  data: T;
  meta: { version: string; timestamp: string };
};

export class ShreeShyamApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = "ShreeShyamApiError";
  }
}

export class ShreeShyamClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(options: ShreeShyamClientOptions) {
    this.apiKey = options.apiKey;
    const base = (options.baseUrl || "https://shree-shyam-dairy-farm.vercel.app").replace(
      /\/$/,
      ""
    );
    this.baseUrl = `${base}/api/public/${options.version || "v1"}`;
  }

  private async request<T>(path: string, init?: RequestInit): Promise<ApiResponse<T>> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new ShreeShyamApiError(
        res.status,
        err.error || "unknown",
        err.message || res.statusText
      );
    }

    return res.json() as Promise<ApiResponse<T>>;
  }

  readonly products = {
    list: (params?: { category?: string; limit?: number; offset?: number }) => {
      const qs = new URLSearchParams();
      if (params?.category) qs.set("category", params.category);
      if (params?.limit) qs.set("limit", String(params.limit));
      if (params?.offset) qs.set("offset", String(params.offset));
      const q = qs.toString();
      return this.request<unknown[]>(`/products${q ? `?${q}` : ""}`);
    },
    get: (id: string) => this.request<unknown>(`/products/${id}`),
  };

  readonly orders = {
    get: (orderNumber: string) => this.request<unknown>(`/orders/${orderNumber}`),
  };

  readonly account = {
    me: () => this.request<unknown>("/me"),
  };

  readonly webhooks = {
    deliveries: (limit = 20) => this.request<unknown[]>(`/webhooks/deliveries?limit=${limit}`),
  };
}

export function verifyWebhookSignature(
  secret: string,
  payload: string,
  timestamp: string,
  signature: string
): boolean {
  // Use crypto.createHmac in Node.js; browser consumers should use Web Crypto
  if (typeof process !== "undefined" && process.versions?.node) {
    const ts = Number(timestamp);
    if (!ts || Math.abs(Date.now() / 1000 - ts) > 300) return false;
    const expected = createHmac("sha256", secret).update(`${timestamp}.${payload}`).digest("hex");
    return signature.replace(/^v1=/, "") === expected;
  }
  return false;
}
