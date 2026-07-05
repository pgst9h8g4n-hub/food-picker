import { supabase } from '@/lib/supabase'

/**
 * 将 File 转为 base64 Data URL（用于即时预览）
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
 * 压缩图片为 WebP 格式
 * 限制最大边长 1200px，质量 0.8
 * 移动端上传大图（通常 3-5MB）压缩至 ~200KB
 */
export function compressImage(
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
 * 上传单张图片到 Supabase Storage
 * @returns 上传后的文件路径（用于后续生成签名 URL）
 */
export async function uploadImage(file: File): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('未登录')

  const compressed = await compressImage(file)
  const fileName = `${session.user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.webp`

  console.log('[upload] 开始上传:', fileName, '大小:', file.size, '压缩后:', compressed.size)

  const { error: uploadError } = await supabase.storage
    .from('food-images')
    .upload(fileName, compressed, { upsert: true })

  if (uploadError) {
    console.error('[upload] 上传失败:', uploadError)
    throw uploadError
  }

  console.log('[upload] 上传成功, path:', fileName)
  return fileName
}

/**
 * 生成图片的签名 URL（私有 bucket 可访问）
 * 有效期 1 小时
 */
export async function getSignedUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from('food-images')
    .createSignedUrl(path, 3600)
  if (error) {
    console.error('[upload] 签名 URL 生成失败:', error)
    throw error
  }
  return data.signedUrl
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
