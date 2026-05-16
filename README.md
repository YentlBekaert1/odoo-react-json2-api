# odoo-react-json2-api

React hooks and context for the **Odoo External JSON-2 API**, authenticated
with an **API key** (Odoo ≥ 19). https://www.odoo.com/documentation/19.0/developer/reference/external_api.html

Supports two auth modes — pick the one that fits your use case:

| Mode | When to use |
|---|---|
| **App-level** | One shared service-account key for the whole app (server-side rendering, internal tools, single-tenant SaaS) |
| **User-level** | Every user provides their own Odoo API key at runtime (multi-user apps, portals) |


---

## Installation

```bash
npm i odoo-react-json2-api
```

---

## Generating an API key in Odoo

1. Enable developer mode: **Settings → Activate developer mode**
2. Go to **Settings → Technical → API Keys**
3. Click **New**, give it a name, and copy the generated key

> ⚠️ **Security:** never hard-code API keys in client-side source code.
> Load them from environment variables (e.g. `import.meta.env.VITE_ODOO_API_KEY`
> with Vite, or `process.env.ODOO_API_KEY` on the server side).
> For browser apps, consider proxying requests through your own backend so
> the key is never exposed to end users.

---

## Mode 1 — App-level auth (shared API key)

One key is set in `<OdooProvider>` and used for every request.

```tsx
// main.tsx
import { OdooProvider } from "react-odoo-jsonrpc";

<OdooProvider
  options={{
    baseUrl:  import.meta.env.VITE_ODOO_URL,   // "https://mycompany.odoo.com"
    db:       import.meta.env.VITE_ODOO_DB,
    username: import.meta.env.VITE_ODOO_USER,  // "admin@mycompany.com"
    apiKey:   import.meta.env.VITE_ODOO_KEY,
  }}
>
  <App />
</OdooProvider>
```

All data hooks work immediately — no login step needed.

```tsx
import { useOdooSearchRead } from "react-odoo-jsonrpc";

function PartnerList() {
  const { data, isLoading, error } = useOdooSearchRead(
    "res.partner",
    [["is_company", "=", true]],
    { fields: ["id", "name", "email"], limit: 50 }
  );
  // ...
}
```

---

## Mode 2 — User-level auth (per-user API keys)

Omit `username` and `apiKey` from the provider options.
Each user supplies their own key at runtime via `useOdooUserAuth()`.

### Set up the provider

```tsx
// main.tsx
<OdooProvider
  options={{
    baseUrl: "https://mycompany.odoo.com",
    db:      "mycompany",
    // no username / apiKey here
  }}
>
  <App />
</OdooProvider>
```

### Build a login form

```tsx
import { useOdooUserAuth } from "react-odoo-jsonrpc";

function ApiKeyLogin() {
  const { login, logout, isAuthenticated, username } = useOdooUserAuth();
  const [email, setEmail] = useState("");
  const [key,   setKey]   = useState("");

  if (isAuthenticated) {
    return (
      <div>
        Logged in as <strong>{username}</strong>
        <button onClick={logout}>Sign out</button>
      </div>
    );
  }

  return (
    <div>
      <input
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="Odoo email"
      />
      <input
        value={key}
        onChange={e => setKey(e.target.value)}
        placeholder="API key"
        type="password"
      />
      <button onClick={() => login(email, key)}>Connect</button>
    </div>
  );
}
```

### Data hooks work exactly the same

They wait silently until credentials are set, then run automatically.

```tsx
function Dashboard() {
  const { isAuthenticated } = useOdooUserAuth();
  const { data: orders } = useOdooSearchRead(
    "sale.order",
    [["state", "=", "sale"]],
    { fields: ["name", "partner_id", "amount_total"], limit: 20 }
  );

  if (!isAuthenticated) return <ApiKeyLogin />;
  // ...
}
```

---

## Mixed mode

You can have app-level credentials as a fallback **and** allow users to
override with their own key. User credentials always take precedence.

```tsx
<OdooProvider
  options={{
    baseUrl:  "https://mycompany.odoo.com",
    db:       "mycompany",
    username: import.meta.env.VITE_ODOO_SERVICE_USER,
    apiKey:   import.meta.env.VITE_ODOO_SERVICE_KEY,
  }}
>
  <App />   {/* uses service account by default */}
            {/* any component can call login() to switch to a user key */}
</OdooProvider>
```

---

## API Reference

### `<OdooProvider>`

| Prop | Type | Required | Description |
|---|---|---|---|
| `options` | `OdooClientOptions` | ✅ | Connection config |
| `children` | `ReactNode` | ✅ | |

### `OdooClientOptions`

```ts
interface OdooClientOptions {
  baseUrl:   string;   // "https://mycompany.odoo.com"
  db:        string;   // database name
  username?: string;   // app-level login (omit for user-level mode)
  apiKey?:   string;   // app-level API key (omit for user-level mode)
  headers?:  Record<string, string>;
  timeoutMs?: number;  // default: 30 000
}
```

### Hooks

| Hook | Description |
|---|---|
| `useOdooUserAuth()` | Auth state + `login(username, apiKey)` + `logout()` |
| `useOdooSearchRead(model, domain?, opts?)` | Search & read records |
| `useOdooRecord(model, id, fields?)` | Single record by ID |
| `useOdooQuery(fn, deps)` | Generic declarative query |
| `useOdooMutation(fn)` | Imperative write operations |
| `useOdooClient()` | Raw `OdooClient` instance |

### `useOdooUserAuth()` return value

```ts
{
  isAuthenticated: boolean;   // true once login() has been called
  username: string | null;    // active username, or null
  login(username, apiKey): void;
  logout(): void;
}
```

### `OdooClient` methods

| Method | Description |
|---|---|
| `setCredentials(username, apiKey)` | Set user-level credentials |
| `clearCredentials()` | Clear user-level credentials |
| `hasCredentials` | Whether any credentials are active |
| `activeUsername` | The current username, or null |
| `searchRead(model, domain, opts)` | Search + read fields |
| `search(model, domain, opts)` | Return matching IDs |
| `read(model, ids, fields)` | Read by IDs |
| `create(model, values)` | Create record → new ID |
| `write(model, ids, values)` | Update records |
| `unlink(model, ids)` | Delete records |
| `searchCount(model, domain)` | Count matching records |
| `fieldsGet(model, attributes)` | Field metadata |
| `callMethod(model, method, args, kwargs)` | Any ORM method |
| `callKw(model, method, args, kwargs)` | Raw `call_kw` |
| `rpc(path, params)` | Raw JSON-RPC call |

---

## CORS note

For local development, proxy through Vite to avoid CORS issues:

```ts
// vite.config.ts
export default {
  server: {
    proxy: { "/web": "http://localhost:8069" },
  },
};
```

Then set `baseUrl: ""` in `OdooClientOptions`.

---

## License

MIT
