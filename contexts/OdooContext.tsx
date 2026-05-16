import {
  createContext,
  useContext,
  useMemo,
  type ReactNode, useState, useCallback,
} from "react";

import { OdooClient } from "../integrations/OdooClient.ts";
import type { OdooClientOptions } from "../types/types.ts";


// ─── Context value ────────────────────────────────────────────────────────────

export interface OdooContextValue {
  client: OdooClient;
  /**
   * Auth mode inferred from the options passed to `<OdooProvider>`:
   * - `"app"`  — `username` + `apiKey` were supplied; all requests share them.
   * - `"user"` — no credentials in options; each user sets their own key.
   */
  authMode: "app" | "user";
  /**
   * True when credentials are available (always true in app mode;
   * true in user mode only after `login()` has been called).
   */
  isAuthenticated: boolean;
  /** Active username, or null when no user credentials are set (user mode). */
  username: string | null;
  /**
   * Set the active user's credentials (user-level auth mode).
   * Has no effect in app mode.
   */
  login: (username: string, apiKey: string) => void;
  /**
   * Clear the active user's credentials (user-level auth mode).
   * Has no effect in app mode.
   */
  logout: () => void;
}

const OdooContext = createContext<OdooContextValue | null>(null);


// ─── Provider ─────────────────────────────────────────────────────────────────

export interface OdooProviderProps {
  /**
   * Connection options including `baseUrl`, `db`, `username`, and `apiKey`.
   * The client is recreated only when `baseUrl` or `db` changes, so it is
   * safe to derive `options` inside a component as long as those two values
   * are stable (e.g. from env vars).
   */
  options: OdooClientOptions;
  children: ReactNode;
}

/**
 * Wrap your app (or a sub-tree) with `<OdooProvider>` to make the Odoo client
 * available to all child components via `useOdoo()` / the other hooks.
 *
 * @example
 * <OdooProvider
 *   options={{
 *     baseUrl: import.meta.env.VITE_ODOO_URL,
 *     db:      import.meta.env.VITE_ODOO_DB,
 *     username: import.meta.env.VITE_ODOO_USER,
 *     apiKey:  import.meta.env.VITE_ODOO_API_KEY,
 *   }}
 * >
 *   <App />
 * </OdooProvider>
 */
export function OdooProvider({ options, children }: OdooProviderProps) {
  const authMode: "app" | "user" =
      options.username && options.apiKey ? "app" : "user";

  // Stable client — recreated only when the base connection params change.
  const client = useMemo(
      () => new OdooClient(options),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [options.baseUrl, options.db, options.username, options.apiKey]
  );

  // Track user-level auth state in React so consumers re-render on change.
  const [username, setUsername] = useState<string | null>(null);

  const login = useCallback(
      (uname: string, apiKey: string) => {
        client.setCredentials(uname, apiKey);
        setUsername(uname);
      },
      [client]
  );

  const logout = useCallback(() => {
    client.clearCredentials();
    setUsername(null);
  }, [client]);

  const isAuthenticated =
      authMode === "app" ? true : username !== null;

  const value = useMemo<OdooContextValue>(
      () => ({ client, authMode, isAuthenticated, username, login, logout }),
      [client, authMode, isAuthenticated, username, login, logout]
  );

  return <OdooContext.Provider value={value}>{children}</OdooContext.Provider>;
}

// ─── Internal hook ────────────────────────────────────────────────────────────

/** @internal – used by the other hooks; exported for advanced use cases */
export function useOdoo(): OdooContextValue {
  const ctx = useContext(OdooContext);
  if (!ctx) {
    throw new Error(
        "useOdoo() must be called inside an <OdooProvider>. " +
        "Wrap your component tree with <OdooProvider options={...}>."
    );
  }
  return ctx;
}
