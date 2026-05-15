import {type DependencyList, useCallback, useEffect, useRef, useState} from "react";
import {useOdoo} from "../contexts/OdooContext.tsx";
import type {UseOdooQueryReturn} from "../types/types.ts";
import type {OdooClient} from "../integrations/OdooClient.ts";

/**
 * Generic declarative query hook.
 * Re-runs whenever `deps` change (like `useEffect`).
 *
 * @param queryFn  Async function that receives the client and returns data.
 * @param deps     Dependency array — same semantics as `useEffect`.
 *
 * @example
 * const { data, isLoading, error, refetch } = useOdooQuery(
 *   (client) => client.searchRead("res.partner", [["active", "=", true]], {
 *     fields: ["id", "name", "email"],
 *     limit: 100,
 *   }),
 *   [] // run once on mount
 * );
 */
export function useOdooQuery<T>(
    queryFn: (client: OdooClient) => Promise<T>,
    deps: DependencyList = []
): UseOdooQueryReturn<T> {
    const { client } = useOdoo();
    const [data, setData]       = useState<T | null>(null);
    const [isLoading, setLoading] = useState(false);
    const [error, setError]     = useState<Error | null>(null);

    const mountedRef = useRef(true);
    useEffect(() => {
        mountedRef.current = true;
        return () => { mountedRef.current = false; };
    }, []);

    const run = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await queryFn(client);
            if (mountedRef.current) setData(result);
        } catch (err) {
            if (mountedRef.current)
                setError(err instanceof Error ? err : new Error(String(err)));
        } finally {
            if (mountedRef.current) setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [client, ...deps]);

    useEffect(() => { run(); }, [run]); // eslint-disable-line react-hooks/exhaustive-deps

    return { data, isLoading, error, refetch: run };
}