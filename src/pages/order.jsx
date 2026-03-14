import { getQrSession } from '../utils/qr-session'

export default function Order() {
  const session = getQrSession()

  if (!session) return null

  return (
    <div className="mx-auto max-w-2xl p-4">
      <h1 className="mb-6 text-2xl font-bold">Order Confirmation</h1>
      <p className="text-gray-500">
        Your order will be sent to the shop via WhatsApp.
      </p>
      <p className="mt-2 text-sm text-gray-400">
        Table: {session.table}
      </p>
    </div>
  )
}
