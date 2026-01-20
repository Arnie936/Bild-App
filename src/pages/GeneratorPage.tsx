import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Loader2, Sparkles, Download, AlertCircle, LogOut } from 'lucide-react'
import UploadZone from '../components/UploadZone'
import { useAuth } from '../contexts/AuthContext'

type Status = 'idle' | 'loading' | 'success' | 'error'

export default function GeneratorPage() {
  const navigate = useNavigate()
  const { signOut, profile, session, isSubscribed, subscriptionLoading } = useAuth()
  const [image1, setImage1] = useState<File | null>(null)
  const [image2, setImage2] = useState<File | null>(null)
  const [image1Preview, setImage1Preview] = useState<string | null>(null)
  const [image2Preview, setImage2Preview] = useState<string | null>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [resultImage, setResultImage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string>('')
  const maxImageBytes = 8 * 1024 * 1024

  useEffect(() => {
    return () => {
      if (image1Preview) URL.revokeObjectURL(image1Preview)
    }
  }, [image1Preview])

  useEffect(() => {
    return () => {
      if (image2Preview) URL.revokeObjectURL(image2Preview)
    }
  }, [image2Preview])

  useEffect(() => {
    return () => {
      if (resultImage) URL.revokeObjectURL(resultImage)
    }
  }, [resultImage])

  const handleImage1Select = useCallback((file: File | null) => {
    if (file && (!file.type.startsWith('image/') || file.size > maxImageBytes)) {
      setErrorMessage('Bitte wähle ein Bild bis maximal 8 MB aus.')
      setStatus('error')
      setImage1(null)
      setImage1Preview((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return null
      })
      return
    }
    setImage1(file)
    setImage1Preview((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return file ? URL.createObjectURL(file) : null
    })
    setStatus('idle')
    setResultImage(null)
  }, [maxImageBytes])

  const handleImage2Select = useCallback((file: File | null) => {
    if (file && (!file.type.startsWith('image/') || file.size > maxImageBytes)) {
      setErrorMessage('Bitte wähle ein Bild bis maximal 8 MB aus.')
      setStatus('error')
      setImage2(null)
      setImage2Preview((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return null
      })
      return
    }
    setImage2(file)
    setImage2Preview((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return file ? URL.createObjectURL(file) : null
    })
    setStatus('idle')
    setResultImage(null)
  }, [maxImageBytes])

  const handleGenerate = async () => {
    if (!image1 || !image2) return
    if (!isSubscribed) {
      setErrorMessage('Bitte aktiviere dein Abo, um Bilder zu generieren.')
      setStatus('error')
      return
    }
    if (!session?.access_token) {
      setErrorMessage('Bitte melde dich erneut an.')
      setStatus('error')
      return
    }

    setStatus('loading')
    setErrorMessage('')
    setResultImage(null)

    const formData = new FormData()
    formData.append('image1', image1)
    formData.append('image2', image2)

    try {
      const response = await axios.post(
        '/api/webhook',
        formData,
        {
          responseType: 'blob',
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      )

      setResultImage((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return URL.createObjectURL(response.data)
      })
      setStatus('success')
    } catch (error) {
      console.error('Error generating image:', error)
      setErrorMessage('Fehler bei der Bildgenerierung. Bitte versuche es erneut.')
      setStatus('error')
    }
  }

  const handleDownload = () => {
    if (resultImage) {
      const link = document.createElement('a')
      link.href = resultImage
      link.download = 'generiertes-bild.png'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const handleLogout = () => {
    signOut()
    window.location.href = '/login'
  }

  const canGenerate = isSubscribed && !subscriptionLoading && image1 && image2 && status !== 'loading'

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-primary mb-3">
            KI-Bild-Generator
          </h1>
          <p className="text-gray-500 text-lg">
            Lade ein Personenbild und ein Kleidungsstück hoch, um ein neues Bild zu generieren
          </p>
        </div>

        {!isSubscribed && !subscriptionLoading && (
          <div className="mb-8 p-5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-amber-800">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-semibold">Abo erforderlich</p>
              <p className="text-sm text-amber-700">
                Du bist angemeldet, aber brauchst ein aktives Abo, um zu starten.
              </p>
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => navigate('/pricing')}
                  className="px-4 py-2 bg-accent text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
                >
                  Zum Abo
                </button>
              </div>
            </div>
          </div>
        )}

        {subscriptionLoading && (
          <div className="mb-6 flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            Abo-Status wird geprüft...
          </div>
        )}

        {/* Upload Zones */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <UploadZone
            label="Person"
            description="Bild der Person hochladen"
            onImageSelect={handleImage1Select}
            previewUrl={image1Preview}
          />
          <UploadZone
            label="Kleidungsstück"
            description="Bild des Kleidungsstücks hochladen"
            onImageSelect={handleImage2Select}
            previewUrl={image2Preview}
          />
        </div>

        {/* Generate Button */}
        <div className="flex justify-center mb-8">
          <button
            onClick={handleGenerate}
            disabled={!canGenerate}
            className={`
              flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-lg
              transition-all duration-200 shadow-lg
              ${canGenerate
                ? 'bg-accent text-white hover:bg-blue-600 hover:shadow-xl'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }
            `}
          >
            {status === 'loading' ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generiere...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generieren
              </>
            )}
          </button>
        </div>

        {/* Error Message */}
        {status === 'error' && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{errorMessage}</p>
          </div>
        )}

        {/* Result Image */}
        {status === 'success' && resultImage && (
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-primary">Ergebnis</h2>
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-primary transition-colors"
              >
                <Download className="w-4 h-4" />
                Herunterladen
              </button>
            </div>
            <div className="flex justify-center">
              <img
                src={resultImage}
                alt="Generiertes Bild"
                className="max-w-full max-h-[600px] object-contain rounded-lg"
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 flex items-center justify-between">
          <div className="text-sm text-gray-400">
            Powered by KI-Bildgenerierung
          </div>
          <div className="flex items-center gap-4">
            {profile?.full_name && (
              <span className="text-sm text-gray-600">
                Hallo, {profile.full_name}
              </span>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              title="Abmelden"
            >
              <LogOut className="w-5 h-5" />
              <span className="hidden sm:inline">Abmelden</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
