import { useState, useCallback, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import AuthLayout from '../components/AuthLayout'
import { useAuth } from '../contexts/AuthContext'

export default function SignupPage() {
  const { signUp, user, loading: authLoading } = useAuth()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (fullName.length < 2) {
      setError('Der Name muss mindestens 2 Zeichen lang sein.')
      return
    }

    if (password.length < 6) {
      setError('Das Passwort muss mindestens 6 Zeichen lang sein.')
      return
    }

    if (password !== confirmPassword) {
      setError('Die Passwörter stimmen nicht überein.')
      return
    }

    setLoading(true)

    const { error } = await signUp(email, password, fullName)

    if (error) {
      if (error.message.includes('already registered')) {
        setError('Diese E-Mail-Adresse ist bereits registriert.')
      } else {
        setError('Ein Fehler ist aufgetreten. Bitte versuche es erneut.')
      }
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
    }
  }, [email, password, confirmPassword, fullName, signUp])

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

  if (success) {
    return (
      <AuthLayout title="Registrierung erfolgreich" subtitle="Dein Konto wurde erstellt">
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <CheckCircle className="w-16 h-16 text-green-500" />
          </div>
          <p className="text-gray-600">
            Bitte überprüfe dein E-Mail-Postfach und bestätige deine E-Mail-Adresse, um fortzufahren.
          </p>
          <Link
            to="/login"
            className="inline-block px-6 py-3 bg-accent text-white rounded-xl font-semibold hover:bg-blue-600 transition-colors"
          >
            Zur Anmeldung
          </Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Registrieren" subtitle="Erstelle ein Konto, um den KI-Bild-Generator zu nutzen">
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
            Name
          </label>
          <input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all"
            placeholder="Dein vollständiger Name"
          />
        </div>

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
            placeholder="Mindestens 6 Zeichen"
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
            Passwort bestätigen
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all"
            placeholder="Passwort wiederholen"
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
              Registrieren...
            </>
          ) : (
            'Registrieren'
          )}
        </button>

        <p className="text-center text-sm text-gray-500">
          Bereits ein Konto?{' '}
          <Link to="/login" className="text-accent hover:underline font-medium">
            Jetzt anmelden
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}
