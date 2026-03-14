import { useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { createQrSession } from '../utils/qr-session'

export default function Enter() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  useEffect(() => {
    const shopId = searchParams.get('shop')
    const table = searchParams.get('table')

    if (!shopId || !table) {
      navigate('/invalid-access', { replace: true })
      return
    }

    createQrSession(shopId, table)
    navigate('/menu', { replace: true })
  }, [searchParams, navigate])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-gray-500">Verifying QR code...</p>
    </div>
  )
}
