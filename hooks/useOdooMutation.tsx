import {useCallback, useState} from "react";
import {useOdoo} from "../contexts/OdooContext.tsx";
import type {UseOdooMutationReturn} from "../types/types.ts";
import type {OdooClient} from "../integrations/OdooClient.ts";

/**
 * Mutation hook for write operations (create / write / unlink / custom methods).
 * Returns a stable `mutate` function you call imperatively.
 *
 * @example
 * const { mutate: createPartner, isLoading } = useOdooMutation(
 *   (client, values: { name: string; email: string }) =>
 *     client.create("res.partner", values)
 * );
 *
 * // later:
 * const newId = await createPartner({ name: "ACME", email: "info@acme.com" });
 */
export function useOdooMutation<TArgs, TResult = unknown>(
    mutationFn: (client: OdooClient, args: TArgs) => Promise<TResult>
): UseOdooMutationReturn<TArgs, TResult> {
    const {client} = useOdoo();
    const [isLoading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const mutate = useCallback(
        async (args: TArgs): Promise<TResult> => {
            setLoading(true);
            setError(null);
            try {
                return await mutationFn(client, args);
            } catch (err) {
                const e = err instanceof Error ? err : new Error(String(err));
                setError(e);
                throw e;
            } finally {
                setLoading(false);
            }
        },
        [client, mutationFn]
    );

    const reset = useCallback(() => setError(null), []);

    return {mutate, isLoading, error, reset};
}