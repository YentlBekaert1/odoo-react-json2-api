import type {UseOdooApiKeyReturn} from "../types/types.ts";
import {useOdoo} from "../contexts/OdooContext.tsx";

/**
 * Hook for **user-level auth mode**.
 *
 * The user's Odoo email is already known (passed as `username` to
 * `<OdooProvider>`). The user only needs to provide their personal API key
 * once — typically in an "account settings" page, not on every visit.
 *
 * ```tsx
 * function OdooSettings() {
 *   const { isConnected, saveApiKey, clearApiKey } = useOdooApiKey();
 *   const [input, setInput] = useState("");
 *
 *   if (isConnected) {
 *     return (
 *       <div>
 *         <p>✅ Odoo connected</p>
 *         <button onClick={clearApiKey}>Disconnect</button>
 *       </div>
 *     );
 *   }
 *
 *   return (
 *     <div>
 *       <input
 *         value={input}
 *         onChange={e => setInput(e.target.value)}
 *         placeholder="Paste your Odoo API key"
 *         type="password"
 *       />
 *       <button onClick={() => saveApiKey(input)}>Connect</button>
 *     </div>
 *   );
 * }
 * ```
 *
 * In app-level mode `isConnected` is always `true` and `saveApiKey` /
 * `clearApiKey` are no-ops.
 */
export function useOdooApiKey(): UseOdooApiKeyReturn {
    const { isConnected, saveApiKey, clearApiKey } = useOdoo();
    return { isConnected, saveApiKey, clearApiKey };
}