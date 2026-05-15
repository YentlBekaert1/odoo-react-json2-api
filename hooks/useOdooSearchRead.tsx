import {useOdooQuery} from "./useOdooQuery.tsx";
import type {OdooDomain, SearchReadOptions, UseOdooQueryReturn} from "../types/types.ts";

/**
 * Convenience wrapper around `useOdooQuery` for the most common operation.
 * Re-runs automatically when `model`, `domain`, or `options` change.
 *
 * @example
 * const { data: invoices } = useOdooSearchRead<{ id: number; name: string }>(
 *   "account.move",
 *   [["move_type", "=", "out_invoice"], ["state", "=", "posted"]],
 *   { fields: ["id", "name", "amount_total"], limit: 50, order: "invoice_date desc" }
 * );
 */
export function useOdooSearchRead<T = Record<string, unknown>>(
    model: string,
    domain: OdooDomain = [],
    options: SearchReadOptions = {}
): UseOdooQueryReturn<T[]> {
    return useOdooQuery<T[]>(
        (client) => client.searchRead<T>(model, domain, options),
        // Stringify to get stable dep comparison without requiring the caller
        // to memoize the arrays/objects.
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [model, JSON.stringify(domain), JSON.stringify(options)]
    );
}
