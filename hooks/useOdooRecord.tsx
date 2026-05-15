import type {UseOdooQueryReturn} from "../types/types.ts";
import {useOdooQuery} from "./useOdooQuery.tsx";

/**
 * Fetch a single record by ID.
 * Returns `null` while loading or when `id` is `null`.
 *
 * @example
 * const { data: partner } = useOdooRecord<Partner>(
 *   "res.partner", selectedId, ["name", "email", "phone"]
 * );
 */
export function useOdooRecord<T = Record<string, unknown>>(
    model: string,
    id: number | null,
    fields: string[] = []
): UseOdooQueryReturn<T | null> {
    const { data, isLoading, error, refetch } = useOdooQuery<T[]>(
        (client) =>
            id !== null ? client.read<T>(model, [id], fields) : Promise.resolve([]),
        [model, id, JSON.stringify(fields)]
    );

    return { data: data?.[0] ?? null, isLoading, error, refetch };
}
