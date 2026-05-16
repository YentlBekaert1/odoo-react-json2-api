import {
    createContext,
    useContext,
    useMemo,
    type ReactNode, useState, useCallback,
} from "react";

import {OdooClient} from "../integrations/OdooClient.ts";
import type {OdooClientOptions} from "../types/types.ts";


// ─── Context value ────────────────────────────────────────────────────────────

export interface OdooContextValue {
    client: OdooClient;
    /**
     * - `"app"`  — `apiKey` was provided in options; all requests share it.
     * - `"user"` — no `apiKey` in options; each user must supply their own key.
     */
    authMode: "app" | "user";
    /**
     * Whether the client has a working API key.
     * Always `true` in app mode. In user mode, `true` once `saveApiKey()` has
     * been called.
     */
    isConnected: boolean;
    /** The Odoo username this client authenticates as (from options). */
    username: string;
    /**
     * Store the user's personal API key on the client.
     * Only meaningful in user mode; no-op in app mode.
     */
    saveApiKey: (apiKey: string) => void;
    /**
     * Remove the user's API key.
     * Only meaningful in user mode; no-op in app mode.
     */
    clearApiKey: () => void;
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
export function OdooProvider({options, children}: OdooProviderProps) {
    const authMode: "app" | "user" = options.apiKey ? "app" : "user";

    const client = useMemo(
        () => new OdooClient(options),
        // Recreate when any of the stable connection params change.
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [options.baseUrl, options.db, options.username, options.apiKey]
    );

    // Mirror the "has key" state in React so consumers re-render correctly.
    const [hasUserKey, setHasUserKey] = useState(false);

    const saveApiKey = useCallback(
        (apiKey: string) => {
            if (authMode === "user") {
                client.setApiKey(apiKey);
                setHasUserKey(true);
            }
        },
        [client, authMode]
    );

    const clearApiKey = useCallback(() => {
        if (authMode === "user") {
            client.clearApiKey();
            setHasUserKey(false);
        }
    }, [client, authMode]);

    const isConnected = authMode === "app" ? true : hasUserKey;

    const value = useMemo<OdooContextValue>(
        () => ({
            client,
            authMode,
            isConnected,
            username: options.username,
            saveApiKey,
            clearApiKey,
        }),
        [client, authMode, isConnected, options.username, saveApiKey, clearApiKey]
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
