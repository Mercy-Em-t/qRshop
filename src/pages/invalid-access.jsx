import { Link } from 'react-router-dom'

export default function InvalidAccess() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <h1 className="mb-4 text-2xl font-bold text-red-600">Invalid Access</h1>
      <p className="mb-6 text-gray-500">
        Please scan a valid QR code at the venue to access the menu.
      </p>
      <Link
        to="/"
        className="rounded-md bg-gray-800 px-6 py-2 text-white hover:bg-gray-900"
      >
        Go Home
      </Link>
    </div>
  )
}
