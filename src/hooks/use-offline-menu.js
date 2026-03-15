import { useContext } from "react";
import { OfflineMenuContext } from "../contexts/offline-menu-context";

const DEFAULT_VALUE = { categories: {}, loading: true, isOffline: false };

/**
 * Hook to access offline-capable menu data from the OfflineMenuProvider.
 * Returns safe defaults when used outside the provider to avoid crashes.
 */
export function useOfflineMenu() {
  const ctx = useContext(OfflineMenuContext);
  return ctx ?? DEFAULT_VALUE;
}
