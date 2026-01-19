import { useState, useCallback, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Loader2, AlertCircle } from 'lucide-react'
import AuthLayout from '../components/AuthLayout'
import { useAuth } from '../contexts/AuthContext'

export default function LoginPage() {
  const { signIn, user, loading: authLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await signIn(email, password)

    if (error) {
      setError('E-Mail oder Passwort ist falsch.')
      setLoading(false)
    }
  }, [email, password, signIn])

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    )
  }

  if (user) {
    return <Navigate to="/" replace />
  }

  return (
    <AuthLayout title="Anmelden" subtitle="Melde dich an, um den KI-Bild-Generator zu nutzen">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            E-Mail
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all"
            placeholder="deine@email.de"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
            Passwort
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all"
            placeholder="Dein Passwort"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-accent text-white rounded-xl font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Anmelden...
            </>
          ) : (
            'Anmelden'
          )}
        </button>

        <p className="text-center text-sm text-gray-500">
          Noch kein Konto?{' '}
          <Link to="/signup" className="text-accent hover:underline font-medium">
            Jetzt registrieren
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}
