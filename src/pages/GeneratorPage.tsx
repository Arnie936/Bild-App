import { useState, useCallback } from 'react'
import axios from 'axios'
import { Loader2, Sparkles, Download, AlertCircle, LogOut } from 'lucide-react'
import UploadZone from '../components/UploadZone'
import { useAuth } from '../contexts/AuthContext'

type Status = 'idle' | 'loading' | 'success' | 'error'

export default function GeneratorPage() {
  const { signOut, profile } = useAuth()
  const [image1, setImage1] = useState<File | null>(null)
  const [image2, setImage2] = useState<File | null>(null)
  const [image1Preview, setImage1Preview] = useState<string | null>(null)
  const [image2Preview, setImage2Preview] = useState<string | null>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [resultImage, setResultImage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string>('')

  const handleImage1Select = useCallback((file: File | null) => {
    setImage1(file)
    if (file) {
      setImage1Preview(URL.createObjectURL(file))
    } else {
      setImage1Preview(null)
    }
    setStatus('idle')
    setResultImage(null)
  }, [])

  const handleImage2Select = useCallback((file: File | null) => {
    setImage2(file)
    if (file) {
      setImage2Preview(URL.createObjectURL(file))
    } else {
      setImage2Preview(null)
    }
    setStatus('idle')
    setResultImage(null)
  }, [])

  const handleGenerate = async () => {
    if (!image1 || !image2) return

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
          },
        }
      )

      const imageUrl = URL.createObjectURL(response.data)
      setResultImage(imageUrl)
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

  const handleLogout = useCallback(async () => {
    await signOut()
  }, [signOut])

  const canGenerate = image1 && image2 && status !== 'loading'

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
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
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
