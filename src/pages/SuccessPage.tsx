import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, Loader2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function SuccessPage() {
  const navigate = useNavigate()
  const { refreshSubscription, isSubscribed } = useAuth()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    let attempts = 0
    const maxAttempts = 10

    const checkSubscription = async () => {
      await refreshSubscription()
      attempts++

      if (isSubscribed || attempts >= maxAttempts) {
        setChecking(false)
      }
    }

    // Poll für Subscription-Status (Webhook kann etwas dauern)
    const interval = setInterval(checkSubscription, 2000)
    checkSubscription()

    return () => clearInterval(interval)
  }, [refreshSubscription, isSubscribed])

  useEffect(() => {
    if (!checking && isSubscribed) {
      // Nach 3 Sekunden zum Generator weiterleiten
      const timeout = setTimeout(() => {
        navigate('/', { replace: true })
      }, 3000)

      return () => clearTimeout(timeout)
    }
  }, [checking, isSubscribed, navigate])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {checking ? (
          <>
            <Loader2 className="w-16 h-16 animate-spin text-accent mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-primary mb-2">
              Zahlung wird verarbeitet...
            </h1>
            <p className="text-gray-500">
              Bitte warte einen Moment.
            </p>
          </>
        ) : isSubscribed ? (
          <>
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-primary mb-2">
              Zahlung erfolgreich!
            </h1>
            <p className="text-gray-500 mb-6">
              Dein Abo ist jetzt aktiv. Du wirst gleich weitergeleitet...
            </p>
            <button
              onClick={() => navigate('/', { replace: true })}
              className="px-6 py-3 bg-accent text-white font-semibold rounded-xl hover:bg-blue-600 transition-colors"
            >
              Jetzt starten
            </button>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-primary mb-2">
              Fast geschafft!
            </h1>
            <p className="text-gray-500 mb-6">
              Deine Zahlung wird noch verarbeitet. Bitte versuche es in wenigen Minuten erneut.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-accent text-white font-semibold rounded-xl hover:bg-blue-600 transition-colors"
            >
              Erneut prüfen
            </button>
          </>
        )}
      </div>
    </div>
  )
}
