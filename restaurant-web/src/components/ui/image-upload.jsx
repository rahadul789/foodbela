import { useState, useRef, useEffect } from 'react'
import { toast } from 'sonner'
import api from '@/services/api'
import { cn } from '@/lib/utils'
import { Upload, X, Loader2, ImageIcon } from 'lucide-react'

function extractPublicId(url) {
  if (!url) return null
  try {
    const parts = url.split('/upload/')
    if (parts.length < 2) return null
    // Remove version prefix (v1234567/) and file extension
    return parts[1].replace(/^v\d+\//, '').replace(/\.[^.]+$/, '')
  } catch {
    return null
  }
}

function deleteFromCloudinary(publicId) {
  if (!publicId) return
  api.delete('/upload/image', { data: { publicId } }).catch(() => {})
}

export default function ImageUpload({
  value,
  onChange,
  className,
  aspectRatio = 'square',
  label
}) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef(null)
  // Track images uploaded during this session (not yet saved)
  const sessionUploadsRef = useRef([])
  // Track the initial value when component mounts (already saved in DB)
  const savedValueRef = useRef(value)

  useEffect(() => {
    savedValueRef.current = value
  }, [value])

  // Cleanup unsaved uploads on unmount (e.g. dialog cancel)
  useEffect(() => {
    return () => {
      const currentValue = savedValueRef.current
      sessionUploadsRef.current.forEach((publicId) => {
        // Only delete if this upload is NOT the currently saved value
        const uploadedId = publicId
        const currentId = extractPublicId(currentValue)
        if (uploadedId !== currentId) {
          deleteFromCloudinary(uploadedId)
        }
      })
    }
  }, [])

  const upload = async (file) => {
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB')
      return
    }

    // If replacing, delete the old one from Cloudinary
    const oldPublicId = extractPublicId(value)

    setUploading(true)
    setProgress(0)

    const formData = new FormData()
    formData.append('image', file)

    try {
      const { data } = await api.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          const pct = Math.round((e.loaded * 100) / (e.total || 1))
          setProgress(pct)
        }
      })

      const newPublicId = data.data.publicId
      sessionUploadsRef.current.push(newPublicId)

      // Delete old image if it was replaced
      if (oldPublicId) {
        deleteFromCloudinary(oldPublicId)
        sessionUploadsRef.current = sessionUploadsRef.current.filter((id) => id !== oldPublicId)
      }

      onChange(data.data.url)
      toast.success('Image uploaded')
    } catch {
      toast.error('Upload failed, please try again')
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) upload(file)
  }

  const handleRemove = (e) => {
    e.stopPropagation()
    const publicId = extractPublicId(value)
    if (publicId) {
      deleteFromCloudinary(publicId)
      sessionUploadsRef.current = sessionUploadsRef.current.filter((id) => id !== publicId)
    }
    onChange('')
    if (inputRef.current) inputRef.current.value = ''
  }

  const aspectClass = {
    square: 'aspect-square w-32',
    wide: 'aspect-[16/9] w-full',
    video: 'aspect-video w-full'
  }[aspectRatio] || 'aspect-square w-32'

  return (
    <div
      className={cn(
        'group relative flex items-center justify-center rounded-xl border-2 border-dashed overflow-hidden cursor-pointer transition-colors',
        dragOver ? 'border-primary bg-primary/5' : 'border-input bg-muted/30 hover:border-muted-foreground/50 hover:bg-muted/50',
        uploading && 'pointer-events-none',
        aspectClass,
        className
      )}
      onClick={() => !uploading && inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) upload(file)
        }}
      />

      {/* Uploaded image */}
      {value && !uploading && (
        <>
          <img src={value} alt={label || 'Uploaded'} className="h-full w-full object-cover" />
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/0 opacity-0 transition-all group-hover:bg-black/40 group-hover:opacity-100">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); inputRef.current?.click() }}
              className="rounded-full bg-white/90 p-2 text-foreground shadow hover:bg-white transition-colors"
            >
              <Upload className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="rounded-full bg-white/90 p-2 text-destructive shadow hover:bg-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </>
      )}

      {/* Uploading state */}
      {uploading && (
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <div className="w-24">
            <div className="h-1.5 w-full rounded-full bg-muted">
              <div
                className="h-1.5 rounded-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-1 text-center text-[10px] text-muted-foreground">{progress}%</p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!value && !uploading && (
        <div className="flex flex-col items-center gap-1.5 p-4 text-center">
          <div className="rounded-full bg-muted p-2">
            <ImageIcon className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-xs font-medium text-muted-foreground">
            {label || 'Upload image'}
          </p>
          <p className="text-[10px] text-muted-foreground/60">
            Click or drag & drop
          </p>
        </div>
      )}
    </div>
  )
}
