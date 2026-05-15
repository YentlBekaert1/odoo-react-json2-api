# react-odoo-jsonrpc

React hooks and context for the **Odoo External JSON-RPC API**, authenticated
with an **API key** (Odoo ≥ 14).

Every request uses HTTP Basic Auth (`username:api_key`) — no login call, no
session cookies, no state to manage.

---

## Installation

```bash
npm install react-odoo-jsonrpc
# peer deps (if not already installed)
npm install react react-dom
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

## Quick start

### 1. Wrap your app with `<OdooProvider>`

```tsx
// main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { OdooProvider } from "react-odoo-jsonrpc";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <OdooProvider
    options={{
      baseUrl:  import.meta.env.VITE_ODOO_URL,   // "https://mycompany.odoo.com"
      db:       import.meta.env.VITE_ODOO_DB,    // "mycompany"
      username: import.meta.env.VITE_ODOO_USER,  // "admin@mycompany.com"
      apiKey:   import.meta.env.VITE_ODOO_KEY,   // "your-api-key"
    }}
  >
    <App />
  </OdooProvider>
);
```

### 2. Query records

```tsx
import { useOdooSearchRead } from "react-odoo-jsonrpc";

interface Partner {
  id: number;
  name: string;
  email: string;
}

function PartnerList() {
  const { data: partners, isLoading, error } = useOdooSearchRead<Partner>(
    "res.partner",
    [["is_company", "=", true]],
    { fields: ["id", "name", "email"], limit: 50, order: "name asc" }
  );

  if (isLoading) return <p>Loading…</p>;
  if (error)     return <p>Error: {error.message}</p>;

  return (
    <ul>
      {partners?.map((p) => (
        <li key={p.id}>{p.name} — {p.email}</li>
      ))}
    </ul>
  );
}
```

### 3. Fetch a single record

```tsx
import { useOdooRecord } from "react-odoo-jsonrpc";

function PartnerDetail({ id }: { id: number }) {
  const { data: partner, isLoading } = useOdooRecord(
    "res.partner",
    id,
    ["name", "email", "phone", "street"]
  );

  if (isLoading || !partner) return <p>Loading…</p>;
  return <div>{partner.name as string}</div>;
}
```

### 4. Mutate data

```tsx
import { useOdooMutation } from "react-odoo-jsonrpc";

function CreatePartnerButton() {
  const { mutate: createPartner, isLoading, error } = useOdooMutation(
    (client, values: { name: string; email: string }) =>
      client.create("res.partner", values)
  );

  return (
    <>
      <button
        disabled={isLoading}
        onClick={() => createPartner({ name: "ACME", email: "info@acme.com" })}
      >
        {isLoading ? "Saving…" : "Create partner"}
      </button>
      {error && <p style={{ color: "red" }}>{error.message}</p>}
    </>
  );
}
```

### 5. Custom / advanced queries

```tsx
import { useOdooQuery } from "react-odoo-jsonrpc";

function SaleStats() {
  const { data } = useOdooQuery(
    (client) =>
      client.callMethod("sale.order", "read_group", [
        [["state", "=", "sale"]],
        ["amount_total:sum", "state"],
        ["state"],
      ]),
    []
  );
  // ...
}
```

### 6. Imperative access

```tsx
import { useOdooClient } from "react-odoo-jsonrpc";

function MyComponent() {
  const client = useOdooClient();

  async function handleArchive(id: number) {
    await client.write("res.partner", [id], { active: false });
  }
  // ...
}
```

---

## API Reference

### `<OdooProvider>`

| Prop | Type | Required | Description |
|---|---|---|---|
| `options` | `OdooClientOptions` | ✅ | Connection config (see below) |
| `children` | `ReactNode` | ✅ | |

### `OdooClientOptions`

```ts
interface OdooClientOptions {
  baseUrl:   string;  // "https://mycompany.odoo.com"
  db:        string;  // Odoo database name
  username:  string;  // Odoo login / email
  apiKey:    string;  // External API key from Settings → Technical → API Keys
  headers?:  Record<string, string>; // extra HTTP headers
  timeoutMs?: number; // default: 30 000
}
```

### Hooks

| Hook | Returns | Description |
|---|---|---|
| `useOdooSearchRead(model, domain?, opts?)` | `UseOdooQueryReturn<T[]>` | Search & read records, re-runs when args change |
| `useOdooRecord(model, id, fields?)` | `UseOdooQueryReturn<T\|null>` | Single record by ID |
| `useOdooQuery(fn, deps)` | `UseOdooQueryReturn<T>` | Generic declarative query |
| `useOdooMutation(fn)` | `UseOdooMutationReturn<A, R>` | Imperative write operations |
| `useOdooClient()` | `OdooClient` | Raw client instance |

### `OdooClient` methods

| Method | Description |
|---|---|
| `searchRead(model, domain, opts)` | Search + read fields |
| `search(model, domain, opts)` | Return matching IDs only |
| `read(model, ids, fields)` | Read by IDs |
| `create(model, values)` | Create record → returns new ID |
| `write(model, ids, values)` | Update records |
| `unlink(model, ids)` | Delete records |
| `searchCount(model, domain)` | Count matching records |
| `fieldsGet(model, attributes)` | Field metadata |
| `callMethod(model, method, args, kwargs)` | Call any ORM method |
| `callKw(model, method, args, kwargs)` | Raw `/web/dataset/call_kw` |
| `rpc(path, params)` | Raw JSON-RPC call to any path |

---

## CORS note

If you're calling Odoo directly from a browser, Odoo must allow
cross-origin requests from your domain.

In development, proxy through Vite to avoid CORS issues:

```ts
// vite.config.ts
export default {
  server: {
    proxy: {
      "/web": "http://localhost:8069",
    },
  },
};
```

Then set `baseUrl: ""` in `OdooClientOptions`.

---

## License

MIT
