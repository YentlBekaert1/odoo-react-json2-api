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

## Mode 1 — App-level (shared service-account key)

```tsx
// main.tsx
import { OdooProvider } from "react-odoo-jsonrpc";

<OdooProvider
  options={{
    baseUrl:  import.meta.env.VITE_ODOO_URL,   // "https://mycompany.odoo.com"
    db:       import.meta.env.VITE_ODOO_DB,    // "mycompany"
    username: import.meta.env.VITE_ODOO_USER,  // "service@mycompany.com"
    apiKey:   import.meta.env.VITE_ODOO_KEY,   // External API key
  }}
>
  <App />
</OdooProvider>
```

All data hooks work immediately — no user action needed.

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

## Mode 2 — User-level (per-user API keys)

The user's **email is already known** from your own session / auth system —
you pass it to the provider. The user only needs to supply their Odoo API key
**once** in their account settings. No login form, no username field.

### 1. Pass the current user's email to the provider

```tsx
// App.tsx  (or wherever you have your own auth session)
import { OdooProvider } from "react-odoo-jsonrpc";
import { useCurrentUser } from "./auth"; // your own auth hook

function App() {
  const { email } = useCurrentUser(); // already authenticated in your app

  return (
    <OdooProvider
      options={{
        baseUrl:  "https://mycompany.odoo.com",
        db:       "mycompany",
        username: email,   // user's Odoo email — no apiKey here
      }}
    >
      <Routes />
    </OdooProvider>
  );
}
```

### 2. Add an "API key" field to the user's account settings page

```tsx
import { useOdooApiKey } from "react-odoo-jsonrpc";

function OdooIntegrationSettings() {
  const { isConnected, saveApiKey, clearApiKey } = useOdooApiKey();
  const [input, setInput] = useState("");

  if (isConnected) {
    return (
      <div>
        <p>✅ Odoo is connected to your account.</p>
        <button onClick={clearApiKey}>Disconnect</button>
      </div>
    );
  }

  return (
    <div>
      <p>
        Paste your Odoo API key to connect your account.
        Generate one in Odoo under <strong>Settings → Technical → API Keys</strong>.
      </p>
      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        placeholder="Odoo API key"
        type="password"
      />
      <button onClick={() => { saveApiKey(input); setInput(""); }}>
        Save & Connect
      </button>
    </div>
  );
}
```

### 3. Data hooks work exactly the same — they just wait until connected

```tsx
function Dashboard() {
  const { isConnected } = useOdooApiKey();
  const { data: orders, isLoading } = useOdooSearchRead(
    "sale.order",
    [["state", "=", "sale"]],
    { fields: ["name", "amount_total"], limit: 20 }
  );

  if (!isConnected) {
    return <p>Connect your Odoo account in settings to see your orders.</p>;
  }
  if (isLoading) return <p>Loading…</p>;
  // ...
}
```

The query fires **automatically** the moment `saveApiKey()` is called.
No re-mounts, no manual triggers.

---

## Persisting the API key across reloads

`saveApiKey()` only stores the key in memory. To survive a page reload,
persist it yourself (e.g. in `localStorage` or your backend) and restore it:

```tsx
// On app boot — restore from storage
const savedKey = localStorage.getItem("odoo_api_key");

function App() {
  const { email } = useCurrentUser();
  return (
    <OdooProvider options={{ baseUrl, db, username: email }}>
      <KeyRestorer savedKey={savedKey} />
      <Routes />
    </OdooProvider>
  );
}

// Tiny helper component that restores the key once on mount
function KeyRestorer({ savedKey }: { savedKey: string | null }) {
  const { saveApiKey } = useOdooApiKey();
  useEffect(() => {
    if (savedKey) saveApiKey(savedKey);
  }, []); // eslint-disable-line
  return null;
}

// When saving from the settings form, also persist:
function OdooIntegrationSettings() {
  const { isConnected, saveApiKey, clearApiKey } = useOdooApiKey();
  const [input, setInput] = useState("");

  function handleSave() {
    saveApiKey(input);
    localStorage.setItem("odoo_api_key", input); // persist
    setInput("");
  }

  function handleDisconnect() {
    clearApiKey();
    localStorage.removeItem("odoo_api_key");
  }
  // ...
}
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
  username:  string;   // always required — service account or current user's email
  apiKey?:   string;   // app-level key; omit for user-level mode
  headers?:  Record<string, string>;
  timeoutMs?: number;  // default: 30 000
}
```

### Hooks

| Hook | Description |
|---|---|
| `useOdooApiKey()` | `isConnected`, `saveApiKey(key)`, `clearApiKey()` |
| `useOdooSearchRead(model, domain?, opts?)` | Search & read records |
| `useOdooRecord(model, id, fields?)` | Single record by ID |
| `useOdooQuery(fn, deps)` | Generic declarative query |
| `useOdooMutation(fn)` | Imperative write operations |
| `useOdooClient()` | Raw `OdooClient` instance |

### `useOdooApiKey()` return value

```ts
{
  isConnected: boolean;          // true once saveApiKey() has been called
  saveApiKey(apiKey: string): void;
  clearApiKey(): void;
}
```

### `OdooClient` methods

| Method | Description |
|---|---|
| `setApiKey(apiKey)` | Set the user's runtime API key |
| `clearApiKey()` | Remove the runtime API key |
| `isConnected` | Whether any API key is active |
| `activeUsername` | The fixed username from options |
| `searchRead(model, domain, opts)` | Search + read fields |
| `search(model, domain, opts)` | Return matching IDs |
| `read(model, ids, fields)` | Read by IDs |
| `create(model, values)` | Create record → new ID |
| `write(model, ids, values)` | Update records |
| `unlink(model, ids)` | Delete records |
| `searchCount(model, domain)` | Count matching records |
| `fieldsGet(model, attributes)` | Field metadata |
| `callMethod(model, method, args, kwargs)` | Any ORM method |
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
