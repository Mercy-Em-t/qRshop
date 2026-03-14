import { useContext } from "react";
import { OfflineMenuContext } from "../contexts/offline-menu-context";

export function useOfflineMenu() {
  return useContext(OfflineMenuContext);
}
