import { useState, useEffect } from 'react'
import { X, Upload } from 'lucide-react'
import type { Food, FoodInsert } from '@/types/db'
import { uploadImage, deleteImage } from '@/lib/upload'

interface AddFoodFormProps {
  onSubmit: (food: FoodInsert) => void
  onClose: () => void
  initialData?: Food | null
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
  const [imageUrl, setImageUrl] = useState<string | null>(initialData?.image_url ?? null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  // 追踪图片在 Storage 中的路径（用于删除旧图）
  const [imagePath, setImagePath] = useState<string | null>(null)

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
        // 如果是 Storage 图片，提取 path
        const match = initialData.image_url.match(/\/food-images\/(.+)$/)
        if (match) setImagePath(match[1])
      }
    }
  }, [initialData])

  async function handleParseLink() {
    if (!link.trim()) return
    setLinkLoading(true)
    setLinkError(null)
    try {
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/parse-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: link.trim() }),
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
        setLinkError('已识别为' + (result.parsed.platform === 'meituan' ? '美团/大众点评' : result.parsed.platform === 'xiaohongshu' ? '小红书' : '抖音') + '链接，但页面内容需要 JS 渲染，无法自动提取标题。请手动填写。')
      } else {
        setLinkError('无法识别该平台链接，请手动填写')
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '识别失败'
      setLinkError(msg)
    }
    setLinkLoading(false)
  }

  async function handleImageUpload(file: File) {
    setUploadError(null)
    // 限制 5MB
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
      const url = await uploadImage(file)
      console.log('[AddFoodForm] 图片上传成功:', url)
      setImageUrl(url)
      // 提取 path（public URL 格式: https://xxx.supabase.co/storage/v1/public/foo-images/bar.webp?...）
      const match = url.match(/\/food-images\/(.+?)(\?|$)/)
      if (match) {
        setImagePath(match[1])
        console.log('[AddFoodForm] 提取到 imagePath:', match[1])
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '上传失败'
      console.error('[AddFoodForm] 上传失败:', msg)
      setUploadError(msg)
    }
    setUploading(false)
  }

  function handleDeleteImage() {
    if (imagePath) {
      deleteImage(imagePath).catch(() => {})
    }
    setImageUrl(null)
    setImagePath(null)
    setUploadError(null)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return

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
      image_url: imageUrl,
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

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* 图片上传 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">📷 图片（可选）</label>
            {imageUrl ? (
              <div className="relative">
                <img
                  src={imageUrl}
                  alt="预览"
                  className="w-full h-40 object-cover rounded-lg"
                  onLoad={() => console.log('[AddFoodForm] 图片加载成功')}
                  onError={(e) => {
                    console.error('[AddFoodForm] 图片加载失败, src:', imageUrl)
                    ;(e.target as HTMLImageElement).style.display = 'none'
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
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleImageUpload(file)
                    e.target.value = '' // 允许重复选择同一文件
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
                onClick={handleParseLink}
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
