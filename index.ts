// Client
export { OdooClient, OdooJsonRpcError } from "./integrations/OdooClient";

// Context & Provider
export { OdooProvider, useOdoo } from "./contexts/OdooContext";
export type { OdooContextValue, OdooProviderProps } from "./contexts/OdooContext";

// Hooks
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
  OdooClientOptions,
  OdooDomain,
  OdooDomainLeaf,
  OdooDomainNode,
  OdooDomainOperator,
  SearchReadOptions,
  UseOdooQueryReturn,
  UseOdooMutationReturn,
} from "./types/types";
