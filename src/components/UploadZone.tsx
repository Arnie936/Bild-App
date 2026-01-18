import React, { useCallback, useRef, useState } from 'react'
import { Upload, X, Image as ImageIcon } from 'lucide-react'

interface UploadZoneProps {
  label: string
  description: string
  onImageSelect: (file: File | null) => void
  previewUrl: string | null
}

export default function UploadZone({ label, description, onImageSelect, previewUrl }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      onImageSelect(file)
    }
  }, [onImageSelect])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onImageSelect(file)
    }
  }, [onImageSelect])

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    onImageSelect(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-primary">{label}</label>
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative flex flex-col items-center justify-center
          w-full h-64 rounded-xl border-2 border-dashed
          cursor-pointer transition-all duration-200
          ${isDragging
            ? 'border-accent bg-accent/5'
            : previewUrl
              ? 'border-gray-200 bg-gray-50'
              : 'border-gray-300 bg-white hover:border-accent hover:bg-gray-50'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {previewUrl ? (
          <>
            <img
              src={previewUrl}
              alt="Vorschau"
              className="max-h-full max-w-full object-contain rounded-lg p-2"
            />
            <button
              onClick={handleRemove}
              className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 text-gray-500">
            <div className="p-3 bg-gray-100 rounded-full">
              {isDragging ? (
                <Upload className="w-8 h-8 text-accent" />
              ) : (
                <ImageIcon className="w-8 h-8" />
              )}
            </div>
            <div className="text-center">
              <p className="font-medium text-primary">
                {isDragging ? 'Bild hier ablegen' : 'Bild hochladen'}
              </p>
              <p className="text-sm text-gray-400 mt-1">{description}</p>
            </div>
            <p className="text-xs text-gray-400">
              Drag & Drop oder klicken
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
