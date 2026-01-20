import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Loader2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

// Diese URL wird im Stripe Dashboard erstellt
const STRIPE_PAYMENT_LINK = import.meta.env.VITE_STRIPE_PAYMENT_LINK || ''

export default function PricingPage() {
  const navigate = useNavigate()
  const { user, profile, signOut, refreshSubscription, isSubscribed } = useAuth()
  const [waitingForPayment, setWaitingForPayment] = useState(false)

  // Poll für Subscription-Status nach Klick auf "Abonnieren"
  useEffect(() => {
    if (!waitingForPayment) return

    const checkSubscription = async () => {
      await refreshSubscription()
    }

    const interval = setInterval(checkSubscription, 3000)
    return () => clearInterval(interval)
  }, [waitingForPayment, refreshSubscription])

  // Redirect wenn Subscription aktiv wird
  useEffect(() => {
    if (isSubscribed) {
      navigate('/', { replace: true })
    }
  }, [isSubscribed, navigate])

  const handleSubscribe = useCallback(() => {
    if (!user?.email) return

    // Payment Link mit prefilled email in neuem Tab öffnen
    const paymentUrl = STRIPE_PAYMENT_LINK
      ? `${STRIPE_PAYMENT_LINK}?prefilled_email=${encodeURIComponent(user.email)}`
      : '#'

    // Neuen Tab öffnen und Polling starten
    window.open(paymentUrl, '_blank')
    setWaitingForPayment(true)
  }, [user?.email])

  const handleLogout = () => {
    signOut()
    window.location.href = '/login'
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary mb-2">
              KI-Bild-Generator
            </h1>
            <p className="text-gray-500">
              Hallo{profile?.full_name ? `, ${profile.full_name}` : ''}! Aktiviere dein Abo, um loszulegen.
            </p>
          </div>

          {/* Pricing Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-accent">
            <div className="text-center mb-6">
              <span className="inline-block px-3 py-1 bg-accent/10 text-accent rounded-full text-sm font-medium mb-4">
                Vollzugang
              </span>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-5xl font-bold text-primary">19,99</span>
                <span className="text-xl text-gray-500">EUR</span>
              </div>
              <p className="text-gray-500 mt-1">pro Monat</p>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                  <Check className="w-3 h-3 text-green-600" />
                </div>
                <span className="text-gray-700">Unbegrenzte Bildgenerierungen</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                  <Check className="w-3 h-3 text-green-600" />
                </div>
                <span className="text-gray-700">Hochwertige KI-Ergebnisse</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                  <Check className="w-3 h-3 text-green-600" />
                </div>
                <span className="text-gray-700">Jederzeit kündbar</span>
              </li>
            </ul>

            {waitingForPayment ? (
              <div className="text-center">
                <div className="flex items-center justify-center gap-3 py-4 bg-accent/10 rounded-xl mb-4">
                  <Loader2 className="w-5 h-5 animate-spin text-accent" />
                  <span className="text-accent font-medium">Warte auf Zahlung...</span>
                </div>
                <p className="text-sm text-gray-500">
                  Schließe die Zahlung im neuen Tab ab. Diese Seite aktualisiert sich automatisch.
                </p>
              </div>
            ) : (
              <button
                onClick={handleSubscribe}
                disabled={!STRIPE_PAYMENT_LINK}
                className="w-full py-4 bg-accent text-white font-semibold rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Jetzt abonnieren
              </button>
            )}

            {!STRIPE_PAYMENT_LINK && !waitingForPayment && (
              <p className="text-sm text-red-500 text-center mt-2">
                Payment Link nicht konfiguriert
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="mt-6 text-center">
            <button
              onClick={handleLogout}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              Mit anderem Konto anmelden
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
