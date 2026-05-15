import type {OdooClient} from "../integrations/OdooClient.ts";
import {useOdoo} from "../contexts/OdooContext.tsx";

/**
 * Returns the raw `OdooClient` instance for imperative / custom use.
 *
 * @example
 * const client = useOdooClient();
 * const ids = await client.search("sale.order", [["state", "=", "draft"]]);
 */
export function useOdooClient(): OdooClient {
    return useOdoo().client;
}