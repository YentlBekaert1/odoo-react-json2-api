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

// ─── Credentials ──────────────────────────────────────────────────────────────

/**
 * A username + API key pair, used for HTTP Basic Auth on every request.
 * In app-level mode these come from OdooClientOptions.
 * In user-level mode they are supplied at runtime via `setUserCredentials()`.
 */
export interface OdooCredentials {
  username: string;
  apiKey: string;
}

// ─── Client options ───────────────────────────────────────────────────────────

/**
 * ## App-level auth (single shared API key)
 * Supply `username` + `apiKey` here. Every request uses these credentials.
 *
 * ```ts
 * { baseUrl: "https://mycompany.odoo.com", db: "mycompany",
 *   username: "admin@mycompany.com", apiKey: "key_xxx" }
 * ```
 *
 * ## User-level auth (per-user API keys)
 * Omit `username` and `apiKey`. Call `client.setCredentials(username, apiKey)`
 * (or use the `useOdooUserAuth()` hook) to set them at runtime per user.
 *
 * ```ts
 * { baseUrl: "https://mycompany.odoo.com", db: "mycompany" }
 * ```
 */
export interface OdooClientOptions {
  /** Base URL of the Odoo instance, no trailing slash. */
  baseUrl: string;
  /** Odoo database name. */
  db: string;
  /**
   * App-level username (Odoo login / email).
   * Omit when using per-user API keys.
   */
  username?: string;
  /**
   * App-level External API key.
   * Omit when using per-user API keys.
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

/** Returned by `useOdooUserAuth()` — only meaningful in user-level auth mode. */
export interface UseOdooUserAuthReturn {
  /** Whether the current user has credentials set. */
  isAuthenticated: boolean;
  /** The active username, or null if not set. */
  username: string | null;
  /** Set (or replace) the active user's credentials. */
  login: (username: string, apiKey: string) => void;
  /** Clear the active user's credentials. */
  logout: () => void;
}
