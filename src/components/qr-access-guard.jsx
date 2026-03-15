import { Navigate } from 'react-router-dom'
import { getQrSession } from '../utils/qr-session'

export default function QRAccessGuard({ children }) {
  const session = getQrSession()

  if (!session) {
    return <Navigate to="/invalid-access" replace />
  }

  return children
}
