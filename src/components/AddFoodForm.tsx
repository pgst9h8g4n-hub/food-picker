import { useState, useEffect, useRef } from 'react'
import { X, Upload, Sparkles } from 'lucide-react'
import type { Food, FoodInsert } from '@/types/db'
import { uploadImage, deleteImage, getSignedUrl, fileToBase64 } from '@/lib/upload'

interface AddFoodFormProps {
  onSubmit: (food: FoodInsert) => void
  onClose: () => void
  initialData?: Food | null
}

// 支持的链接平台正则
const LINK_PATTERNS = [
  /xiaohongshu\.com/i,
  /xn--wpr/gi,
  /meituan\.com/i,
  /dianping\.com/i,
  /dpurl\.cn/i,
  /mtw\.so/i,
  /douyin\.com/i,
  /iesdouyin\.com/i,
]

function isSupportedLink(text: string): boolean {
  return LINK_PATTERNS.some((p) => p.test(text))
}

export default function AddFoodForm({ onSubmit, onClose, initialData }: AddFoodFormProps) {
  const [name, setName] = useState('')
  const [city, setCity] = useState('')
  const [region, setRegion] = useState('')
  const [tags, setTags] = useState('')
  const [price, setPrice] = useState('')
  const [rating, setRating] = useState('3')
  const [notes, setNotes] = useState('')
  const [link, setLink] = useState('')
  const [source, setSource] = useState<string | null>(null)
  const [linkLoading, setLinkLoading] = useState(false)
  const [linkError, setLinkError] = useState<string | null>(null)

  // 图片：用 base64 做预览（私有 bucket 也能显示）
  const [imageUrl, setImageUrl] = useState<string | null>(initialData?.image_url ?? null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [imagePath, setImagePath] = useState<string | null>(null)
  const [signedUrlCache, setSignedUrlCache] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 剪贴板检测状态
  const [clipboardLink, setClipboardLink] = useState<string | null>(null)
  const [showAutoDetect, setShowAutoDetect] = useState(false)

  useEffect(() => {
    if (initialData) {
      setName(initialData.name)
      setCity(initialData.city ?? '')
      setRegion(initialData.region ?? '')
      setTags((initialData.tags ?? []).join(', '))
      setPrice(initialData.price?.toString() ?? '')
      setRating((initialData.rating ?? 3).toString())
      setNotes(initialData.notes ?? '')
      setSource(initialData.source)
      setLink(initialData.source_url ?? '')
      if (initialData.image_url) {
        setImageUrl(initialData.image_url)
        // 如果是 Storage 图片，提取 path 用于生成签名 URL
        const match = initialData.image_url.match(/\/food-images\/(.+?)(\?|$)/)
        if (match) {
          setImagePath(match[1])
          // 用 signed URL 加载
          getSignedUrl(match[1]).then(url => {
            setImageUrl(url)
            setSignedUrlCache(url)
          }).catch(() => {
            // signed URL 失败，保持原 URL
          })
        }
      }
    }
  }, [initialData])

  // 弹窗打开时检测剪贴板
  useEffect(() => {
    if (initialData) return

    async function checkClipboard() {
      try {
        const text = await navigator.clipboard.readText()
        if (text && isSupportedLink(text)) {
          setClipboardLink(text)
          setShowAutoDetect(true)
        }
      } catch {
        console.log('[AddFoodForm] 无法读取剪贴板')
      }
    }

    const timer = setTimeout(checkClipboard, 500)
    return () => clearTimeout(timer)
  }, [initialData])

  async function handleAutoDetect() {
    setShowAutoDetect(false)
    if (!clipboardLink) return
    setLink(clipboardLink)
    await doParseLink(clipboardLink)
  }

  function dismissAutoDetect() {
    setShowAutoDetect(false)
  }

  async function doParseLink(url: string) {
    if (!url.trim()) return
    setLinkLoading(true)
    setLinkError(null)
    try {
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/parse-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      })
      const result = await resp.json()
      if (result.error) {
        setLinkError(result.error)
      } else if (result.parsed?.title) {
        setName(result.parsed.title)
        if (result.parsed.image_url) {
          setImageUrl(result.parsed.image_url)
        }
        setSource(result.parsed.platform)
      } else if (result.parsed?.platform) {
        setSource(result.parsed.platform)
        setLinkError(null)
      } else {
        setLinkError(null)
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '识别失败'
      console.warn('[AddFoodForm] 链接解析失败:', msg)
      setLinkError(null)
    }
    setLinkLoading(false)
  }

  async function handleManualParse() {
    doParseLink(link)
  }

  async function handleImageUpload(file: File) {
    setUploadError(null)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('图片不能超过 5MB')
      return
    }
    setUploading(true)
    try {
      // 如果有旧的 Storage 图片，先删除
      if (imagePath) {
        try { await deleteImage(imagePath) } catch { /* ignore */ }
      }

      // 1. 立即用 base64 做预览（不受 bucket 权限影响）
      const base64 = await fileToBase64(file)
      setImageUrl(base64)

      // 2. 后台上传到 Storage
      const path = await uploadImage(file)
      setImagePath(path)
      // 用 signed URL 替换 base64（节省流量）
      const signed = await getSignedUrl(path)
      setImageUrl(signed)
      setSignedUrlCache(signed)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '上传失败'
      console.error('[AddFoodForm] 上传失败:', msg)
      setUploadError(msg)
      // 上传失败不影响 base64 预览
    }
    setUploading(false)
  }

  function handleDeleteImage() {
    if (imagePath) {
      deleteImage(imagePath).catch(() => {})
    }
    setImageUrl(null)
    setImagePath(null)
    setSignedUrlCache(null)
    setUploadError(null)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return

    // 提交时使用 signed URL 或原始 URL
    // base64 太大不适合存数据库，用 signed URL
    const finalImageUrl = signedUrlCache || imageUrl

    const food: FoodInsert = {
      name: name.trim(),
      city: city.trim() || null,
      region: region.trim() || null,
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      price: price ? parseInt(price) : null,
      rating: parseInt(rating),
      source,
      source_url: link.trim() || null,
      notes: notes.trim() || null,
      image_url: finalImageUrl,
      is_eaten: false,
      revisit: initialData?.revisit ?? null,
    }

    onSubmit(food)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[90dvh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{initialData ? '编辑美食' : '添加美食'}</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X size={20} />
          </button>
        </div>

        {/* 剪贴板自动检测提示 */}
        {showAutoDetect && clipboardLink && (
          <div className="bg-orange-50 border-b border-orange-200 px-4 py-3">
            <div className="flex items-start gap-3">
              <Sparkles className="text-orange-500 flex-shrink-0 mt-0.5" size={18} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-orange-800">检测到分享链接</p>
                <p className="text-xs text-orange-600 truncate mt-0.5">
                  {clipboardLink.length > 50 ? clipboardLink.slice(0, 50) + '...' : clipboardLink}
                </p>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={handleAutoDetect}
                    disabled={linkLoading}
                    className="px-3 py-1 bg-orange-500 text-white text-xs rounded-lg font-medium hover:bg-orange-600 disabled:opacity-50"
                  >
                    {linkLoading ? '识别中...' : '自动识别'}
                  </button>
                  <button
                    onClick={dismissAutoDetect}
                    className="px-3 py-1 bg-white text-gray-600 text-xs rounded-lg border hover:bg-gray-50"
                  >
                    暂不识别
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* 图片上传 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">📷 图片（可选）</label>
            {imageUrl ? (
              <div className="relative">
                <img
                  src={imageUrl}
                  alt="预览"
                  className="w-full h-48 object-cover rounded-lg"
                  onError={() => {
                    console.error('[AddFoodForm] 图片加载失败, src:', imageUrl)
                  }}
                />
                <button
                  type="button"
                  onClick={handleDeleteImage}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <label className="block w-full h-28 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-orange-400 transition-colors">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleImageUpload(file)
                    e.target.value = ''
                  }}
                  className="hidden"
                />
                {uploading ? (
                  <span className="text-sm text-gray-400">上传中...</span>
                ) : (
                  <span className="text-sm text-gray-400 flex items-center gap-1">
                    <Upload size={16} /> 点击或拍照上传
                  </span>
                )}
              </label>
            )}
            {uploadError && <p className="text-xs text-red-500 mt-1">{uploadError}</p>}
          </div>

          {/* 名称 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              店名/菜品名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="如：海底捞火锅"
              required
            />
          </div>

          {/* 城市 + 区域 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">城市</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
                placeholder="如：成都"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">区域</label>
              <input
                type="text"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
                placeholder="如：锦江区"
              />
            </div>
          </div>

          {/* 价格 + 评分 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">价格（元）</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
                placeholder="50"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">评分</label>
              <select
                value={rating}
                onChange={(e) => setRating(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
              >
                <option value="1">⭐ 1星</option>
                <option value="2">⭐⭐ 2星</option>
                <option value="3">⭐⭐⭐ 3星</option>
                <option value="4">⭐⭐⭐⭐ 4星</option>
                <option value="5">⭐⭐⭐⭐⭐ 5星</option>
              </select>
            </div>
          </div>

          {/* 标签 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              标签（逗号分隔）
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="川菜, 麻辣, 火锅"
            />
          </div>

          {/* 备注 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
              rows={2}
              placeholder="推荐菜品、个人感受..."
            />
          </div>

          {/* 链接智能识别 */}
          <div className="border-t pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              🔗 来源链接（可选）
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                placeholder="粘贴小红书/抖音/美团链接"
              />
              <button
                type="button"
                onClick={handleManualParse}
                disabled={linkLoading || !link.trim()}
                className="px-3 py-2 bg-purple-500 text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-purple-600 transition-colors whitespace-nowrap"
              >
                {linkLoading ? '识别中...' : '识别'}
              </button>
            </div>
            {linkError && <p className="text-xs text-red-500 mt-1">{linkError}</p>}
          </div>

          <button
            type="submit"
            className="w-full bg-orange-500 text-white py-3 rounded-xl font-medium hover:bg-orange-600 transition-colors"
          >
            {initialData ? '保存修改' : '保存'}
          </button>
        </form>
      </div>
    </div>
  )
}
