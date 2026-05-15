// ─── JSON-RPC primitives ──────────────────────────────────────────────────────

export interface JsonRpcRequest {
  jsonrpc: "2.0";
  method: string;
  id: number;
  params: Record<string, unknown>;
}

export interface JsonRpcResponse<T = unknown> {
  jsonrpc: "2.0";
  id: number;
  result?: T;
  error?: JsonRpcError;
}

export interface JsonRpcError {
  code: number;
  message: string;
  data?: {
    name: string;
    debug: string;
    message: string;
    exception_type: string;
    arguments: unknown[];
  };
}

// ─── Client options ───────────────────────────────────────────────────────────

export interface OdooClientOptions {
  /**
   * Base URL of your Odoo instance, no trailing slash.
   * e.g. "https://mycompany.odoo.com"
   */
  baseUrl: string;
  /** Odoo database name */
  db: string;
  /**
   * Odoo login (email / username) that owns the API key.
   * Sent as the HTTP Basic Auth username on every request.
   */
  username: string;
  /**
   * Odoo External API key generated via
   * Settings → Technical → API Keys (requires developer mode).
   * Sent as the HTTP Basic Auth password on every request.
   *
   * ⚠️  Never hard-code this in client-side source.
   *     Load it from an environment variable or a server-side config endpoint.
   */
  apiKey: string;
  /** Additional HTTP headers added to every request */
  headers?: Record<string, string>;
  /** Request timeout in milliseconds (default: 30 000) */
  timeoutMs?: number;
}

// ─── Domain / search helpers ─────────────────────────────────────────────────

export type OdooDomainOperator =
  | "="  | "!=" | "<"  | "<=" | ">"  | ">="
  | "like" | "ilike" | "not like" | "not ilike"
  | "in"   | "not in"
  | "child_of" | "parent_of";

export type OdooDomainLeaf = [string, OdooDomainOperator, unknown];
export type OdooDomainNode = "&" | "|" | "!";
export type OdooDomain = (OdooDomainLeaf | OdooDomainNode)[];

export interface SearchReadOptions {
  fields?: string[];
  limit?: number;
  offset?: number;
  order?: string;
  context?: Record<string, unknown>;
}

// ─── Hook return shapes ───────────────────────────────────────────────────────

export interface UseOdooQueryReturn<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export interface UseOdooMutationReturn<TArgs, TResult> {
  mutate: (args: TArgs) => Promise<TResult>;
  isLoading: boolean;
  error: Error | null;
  reset: () => void;
}
