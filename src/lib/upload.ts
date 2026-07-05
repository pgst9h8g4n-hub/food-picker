import { supabase } from '@/lib/supabase'

/**
 * 将 File 转为 base64 Data URL
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target?.result as string)
    reader.onerror = () => reject(new Error('File read failed'))
    reader.readAsDataURL(file)
  })
}

/**
 * 压缩图片为 WebP Blob
 */
function compressImageBlob(
  file: File,
  maxWidth = 1200,
  quality = 0.8,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let w = img.width
        let h = img.height
        if (w > h) {
          if (w > maxWidth) { h *= maxWidth / w; w = maxWidth }
        } else {
          if (h > maxWidth) { w *= maxWidth / h; h = maxWidth }
        }
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        if (!ctx) { reject(new Error('Canvas context unavailable')); return }
        ctx.drawImage(img, 0, 0, w, h)
        canvas.toBlob((blob) => {
          blob ? resolve(blob) : reject(new Error('Compression failed'))
        }, 'image/webp', quality)
      }
      img.onerror = () => reject(new Error('Image load failed'))
      img.src = e.target?.result as string
    }
    reader.onerror = () => reject(new Error('File read failed'))
    reader.readAsDataURL(file)
  })
}

/**
 * 压缩图片为 base64（用于预览和直接存储）
 */
export function compressImageToBase64(
  file: File,
  maxWidth = 1200,
  quality = 0.8,
): Promise<string> {
  return compressImageBlob(file, maxWidth, quality).then(blob =>
    fileToBase64(blob as unknown as File)
  )
}

/**
 * 上传单张图片到 Supabase Storage
 * @returns 文件路径
 */
export async function uploadImage(file: File): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('未登录')

  const compressed = await compressImageBlob(file)
  const fileName = `${session.user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.webp`

  const { error: uploadError } = await supabase.storage
    .from('food-images')
    .upload(fileName, compressed, { upsert: true })

  if (uploadError) throw uploadError
  return fileName
}

/**
 * 删除 Supabase Storage 中的图片
 */
export async function deleteImage(filePath: string): Promise<void> {
  const { error } = await supabase.storage
    .from('food-images')
    .remove([filePath])
  if (error) throw error
}
