import {useOdoo} from "../contexts/OdooContext.tsx";
import type {UseOdooUserAuthReturn} from "../types/types.ts";

/**
 * Hook for **user-level auth mode**.
 * Returns the current auth state and `login` / `logout` helpers.
 *
 * Call `login(username, apiKey)` when the user submits their credentials.
 * Call `logout()` to clear them.
 *
 * In app-level auth mode `isAuthenticated` is always `true` and
 * `login` / `logout` are no-ops.
 *
 * @example
 * function ApiKeyForm() {
 *   const { login, isAuthenticated } = useOdooUserAuth();
 *   const [user, setUser] = useState("");
 *   const [key,  setKey]  = useState("");
 *
 *   if (isAuthenticated) return <Dashboard />;
 *
 *   return (
 *     <>
 *       <input value={user} onChange={e => setUser(e.target.value)} placeholder="Email" />
 *       <input value={key}  onChange={e => setKey(e.target.value)}  placeholder="API key" type="password" />
 *       <button onClick={() => login(user, key)}>Connect</button>
 *     </>
 *   );
 * }
 */
export default function useOdooUserAuth(): UseOdooUserAuthReturn {
    const { isAuthenticated, username, login, logout } = useOdoo();
    return { isAuthenticated, username, login, logout };
}