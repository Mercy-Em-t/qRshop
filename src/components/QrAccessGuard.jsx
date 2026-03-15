import { getQrSession } from "../utils/qr-session";
import { Navigate } from "react-router-dom";

export default function QrAccessGuard({ children }) {
  const session = getQrSession();

  if (session == null) {
    return <Navigate to="/invalid-access" replace />;
  }

  return children;
}
