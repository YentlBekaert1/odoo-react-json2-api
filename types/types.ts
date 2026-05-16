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

/**
 * ## App-level auth
 * Provide `username` + `apiKey`. All requests share these credentials.
 *
 * ## User-level auth
 * Provide `username` (the user's Odoo login, known from your own app's session).
 * Omit `apiKey` — the user will supply only their personal API key at runtime
 * via `useOdooApiKey()` or `client.setApiKey(key)`.
 */
export interface OdooClientOptions {
  /** Base URL of the Odoo instance, no trailing slash. */
  baseUrl: string;
  /** Odoo database name. */
  db: string;
  /**
   * The Odoo login / email for this client.
   *
   * - App-level: the service-account email.
   * - User-level: the current user's Odoo email (from your app's own auth).
   *   Pass this in so the user never has to type it themselves.
   */
  username: string;
  /**
   * App-level External API key.
   * Omit when every user supplies their own key at runtime.
   */
  apiKey?: string;
  /** Additional HTTP headers on every request. */
  headers?: Record<string, string>;
  /** Request timeout in milliseconds (default: 30 000). */
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

/**
 * Returned by `useOdooApiKey()`.
 * Used in user-level auth mode where the username is already known
 * and the user only needs to supply their personal API key.
 */
export interface UseOdooApiKeyReturn {
  /** True once the user has saved their API key. */
  isConnected: boolean;
  /** Save (or replace) the user's API key. */
  saveApiKey: (apiKey: string) => void;
  /** Remove the user's API key (disconnects from Odoo). */
  clearApiKey: () => void;
}
