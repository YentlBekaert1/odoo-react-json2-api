// Client
export { OdooClient, OdooJsonRpcError } from "./integrations/OdooClient";

// Context & Provider
export { OdooProvider, useOdoo } from "./contexts/OdooContext";
export type { OdooContextValue, OdooProviderProps } from "./contexts/OdooContext";

// Hooks
export { useOdooUserAuth } from "./hooks/useOdooUserAuth";
export { useOdooClient } from "./hooks/useOdooClient";
export { useOdooQuery } from "./hooks/useOdooQuery";
export { useOdooMutation } from "./hooks/useOdooMutation";
export { useOdooSearchRead } from "./hooks/useOdooSearchRead";
export { useOdooRecord } from "./hooks/useOdooRecord";

// Types
export type {
  JsonRpcRequest,
  JsonRpcResponse,
  JsonRpcError,
  OdooCredentials,
  OdooClientOptions,
  OdooDomain,
  OdooDomainLeaf,
  OdooDomainNode,
  OdooDomainOperator,
  SearchReadOptions,
  UseOdooQueryReturn,
  UseOdooMutationReturn,
  UseOdooUserAuthReturn,
} from "./types/types";
