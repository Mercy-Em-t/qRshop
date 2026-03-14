import { getQrSession } from "../utils/qr-session";
import OfflineMenuProvider from "./OfflineMenuProvider";

/**
 * Reads the current QR session and wraps children with OfflineMenuProvider
 * so that child components can use the useOfflineMenu() hook.
 */
export default function OfflineMenuWrapper({ children }) {
  const session = getQrSession();
  return (
    <OfflineMenuProvider shopId={session?.shop_id}>
      {children}
    </OfflineMenuProvider>
  );
}
