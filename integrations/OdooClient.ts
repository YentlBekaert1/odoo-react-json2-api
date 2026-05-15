import type {JsonRpcRequest, JsonRpcResponse, OdooClientOptions} from "../types/types.ts";

let _requestId = 1;
const nextId = () => _requestId++;

export class OdooJsonRpcError extends Error {
  constructor(
      message: string,
      public readonly code?: number,
      public readonly data?: unknown
  ) {
    super(message);
    this.name = "OdooJsonRpcError";
  }
}

/**
 * Stateless Odoo JSON-RPC client that authenticates via HTTP Basic Auth
 * using an External API key (Odoo ≥ 14).
 *
 * Every request carries an `Authorization: Basic <base64(username:apiKey)>`
 * header. No session cookies, no login call needed.
 *
 * Generate an API key in Odoo:
 *   Settings → (enable developer mode) → Technical → API Keys → New
 */
export class OdooClient {
  private readonly baseUrl: string;
  private readonly db: string;
  private readonly authHeader: string;
  private readonly extraHeaders: Record<string, string>;
  private readonly timeoutMs: number;

  constructor(options: OdooClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
    this.db = options.db;
    this.timeoutMs = options.timeoutMs ?? 30_000;
    this.extraHeaders = options.headers ?? {};

    // Build the Basic auth header once; reuse on every request.
    // btoa is available in all modern browsers and in Node ≥ 16.
    this.authHeader =
        "Basic " + btoa(`${options.username}:${options.apiKey}`);
  }

  // ─── Low-level RPC ─────────────────────────────────────────────────────────

  /**
   * Send a raw JSON-RPC 2.0 request to `path`.
   * You rarely need to call this directly; use the ORM helpers instead.
   */
  async rpc<T = unknown>(
      path: string,
      params: Record<string, unknown>
  ): Promise<T> {
    const body: JsonRpcRequest = {
      jsonrpc: "2.0",
      method: "call",
      id: nextId(),
      params,
    };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}${path}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: this.authHeader,
          ...this.extraHeaders,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) {
      throw new OdooJsonRpcError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status
      );
    }

    const json: JsonRpcResponse<T> = await response.json();

    if (json.error) {
      throw new OdooJsonRpcError(
          json.error.data?.message ?? json.error.message,
          json.error.code,
          json.error.data
      );
    }

    return json.result as T;
  }

  // ─── ORM helpers ───────────────────────────────────────────────────────────

  /**
   * Call any method on an Odoo model via `/web/dataset/call_kw`.
   * This is the building block for all higher-level helpers.
   */
  async callKw<T = unknown>(
      model: string,
      method: string,
      args: unknown[] = [],
      kwargs: Record<string, unknown> = {}
  ): Promise<T> {
    return this.rpc<T>("/web/dataset/call_kw", {
      model,
      method,
      args,
      kwargs: {
        context: { lang: "en_US", tz: "UTC" },
        ...kwargs,
      },
    });
  }

  /**
   * Search for records matching `domain` and return the requested fields.
   *
   * @example
   * const partners = await client.searchRead("res.partner",
   *   [["is_company", "=", true]],
   *   { fields: ["id", "name", "email"], limit: 50 }
   * );
   */
  async searchRead<T = Record<string, unknown>>(
      model: string,
      domain: OdooDomain = [],
      options: SearchReadOptions = {}
  ): Promise<T[]> {
    return this.callKw<T[]>(model, "search_read", [domain], {
      fields:  options.fields  ?? [],
      limit:   options.limit   ?? 0,
      offset:  options.offset  ?? 0,
      order:   options.order   ?? "",
      context: options.context ?? {},
    });
  }

  /**
   * Search and return only the matching record IDs.
   */
  async search(
      model: string,
      domain: OdooDomain = [],
      options: { limit?: number; offset?: number; order?: string } = {}
  ): Promise<number[]> {
    return this.callKw<number[]>(model, "search", [domain], options);
  }

  /**
   * Read specific fields of records by their IDs.
   */
  async read<T = Record<string, unknown>>(
      model: string,
      ids: number[],
      fields: string[] = []
  ): Promise<T[]> {
    return this.callKw<T[]>(model, "read", [ids], { fields });
  }

  /**
   * Create a new record and return its ID.
   */
  async create(
      model: string,
      values: Record<string, unknown>
  ): Promise<number> {
    return this.callKw<number>(model, "create", [values]);
  }

  /**
   * Update existing records.
   */
  async write(
      model: string,
      ids: number[],
      values: Record<string, unknown>
  ): Promise<boolean> {
    return this.callKw<boolean>(model, "write", [ids, values]);
  }

  /**
   * Delete records.
   */
  async unlink(model: string, ids: number[]): Promise<boolean> {
    return this.callKw<boolean>(model, "unlink", [ids]);
  }

  /**
   * Count records matching a domain.
   */
  async searchCount(model: string, domain: OdooDomain = []): Promise<number> {
    return this.callKw<number>(model, "search_count", [domain]);
  }

  /**
   * Retrieve field definitions for a model.
   */
  async fieldsGet(
      model: string,
      attributes: string[] = ["string", "type", "required"]
  ): Promise<Record<string, Record<string, unknown>>> {
    return this.callKw(model, "fields_get", [], { attributes });
  }

  /**
   * Call any arbitrary ORM method on a model (e.g. `read_group`, `name_search`).
   *
   * @example
   * const groups = await client.callMethod(
   *   "sale.order",
   *   "read_group",
   *   [[["state", "=", "sale"]], ["amount_total:sum", "state"], ["state"]]
   * );
   */
  async callMethod<T = unknown>(
      model: string,
      method: string,
      args: unknown[] = [],
      kwargs: Record<string, unknown> = {}
  ): Promise<T> {
    return this.callKw<T>(model, method, args, kwargs);
  }
}