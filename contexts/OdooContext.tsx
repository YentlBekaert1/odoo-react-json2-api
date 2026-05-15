import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";

import { OdooClient } from "../integrations/OdooClient.ts";
import type { OdooClientOptions } from "../types/types.ts";


// ─── Context value ────────────────────────────────────────────────────────────

export interface OdooContextValue {
  client: OdooClient;
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
  // Recreate the client only when the base connection params change.
  const client = useMemo(
    () => new OdooClient(options),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [options.baseUrl, options.db, options.username, options.apiKey]
  );

  const value = useMemo<OdooContextValue>(() => ({ client }), [client]);

  return <OdooContext.Provider value={value}>{children}</OdooContext.Provider>;
}

// ─── Internal hook ────────────────────────────────────────────────────────────

/** @internal – used by the other hooks; exported for advanced use cases */
export function useOdoo(): OdooContextValue {
  const ctx = useContext(OdooContext);
  if (!ctx) {
    throw new Error(
      "useOdoo() must be called inside an <OdooProvider>. " +
        "Make sure your component tree is wrapped with <OdooProvider options={...}>."
    );
  }
  return ctx;
}
