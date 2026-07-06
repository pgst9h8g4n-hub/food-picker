import { useState, useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import type { Food, Place, FoodInsert, PlaceInsert, ItemType } from '@/types/db'

interface AddItemFormProps {
  onSubmit: (item: FoodInsert | PlaceInsert) => void | Promise<void>
  onClose: () => void
  initialData?: Food | Place | null
  itemType: ItemType
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

/**
 * 从推荐文案中提取店名
 */
function extractShopName(text: string): string | null {
  const match1 = text.match(/【([^】]+?)】/)
  if (match1) return match1[1].trim()
  const match2 = text.match(/(?:店名|店铺|餐厅|餐馆)[:：\s]+(.{2,30})(?:\s|$|[【])/)
  if (match2) return match2[1].trim()
  const match3 = text.match(/^[一-鿿〇〇]{2,30}/)
  if (match3 && match3[0].length >= 2) return match3[0].trim()
  return null
}

/**
 * 从推荐文案中提取地址
 */
function extractAddress(text: string): string | null {
  const match1 = text.match(/【(?:地址)[:：\s]*(.{2,50})】/)
  if (match1) return match1[1].trim()
  const match2 = text.match(/(?:地址)[:：\s]+(.{2,50})(?:\s|$|[【])/)
  if (match2) return match2[1].trim()
  const match3 = text.match(/((?:[一-龥]+)(?:路|街|大道|巷|弄|号|栋|楼)[^\s【】]{0,30})/)
  if (match3 && match3[1].length >= 4) return match3[1].trim()
  return null
}

export default function AddItemForm({ onSubmit, onClose, initialData, itemType }: AddItemFormProps) {
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [region, setRegion] = useState('')
  const [tags, setTags] = useState('')
  const [price, setPrice] = useState('')
  const [rating, setRating] = useState('3')
  const [notes, setNotes] = useState('')
  const [copyText, setCopyText] = useState('')
  const [link, setLink] = useState('')
  const [source, setSource] = useState<string | null>(null)
  const [linkLoading, setLinkLoading] = useState(false)
  const [linkError, setLinkError] = useState<string | null>(null)
  const [isEaten, setIsEaten] = useState(false)       // 美食：是否已吃过
  const [isVisited, setIsVisited] = useState(false)    // 好玩：是否去过

  const parseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (parseTimerRef.current) clearTimeout(parseTimerRef.current)
    }
  }, [])

  // 填充初始数据
  useEffect(() => {
    if (initialData) {
      setName(initialData.name)
      setAddress(initialData.address ?? '')
      setCity(initialData.city ?? '')
      setRegion(initialData.region ?? '')
      setTags((initialData.tags ?? []).join(', '))
      setRating((initialData.rating ?? 3).toString())
      setNotes(initialData.notes ?? '')
      setCopyText(initialData.notes ?? '')
      setSource(initialData.source)
      setLink(initialData.source_url ?? '')
      if (itemType === 'food') {
        setIsEaten((initialData as Food).is_eaten)
      } else {
        setIsVisited((initialData as Place).is_visited)
      }
    }
  }, [initialData, itemType])

  // 打开新增弹窗时，尝试读取剪贴板
  useEffect(() => {
    if (initialData) return

    async function checkClipboard() {
      try {
        const text = await navigator.clipboard.readText()
        if (!text) return
        if (isSupportedLink(text)) {
          setLink(text)
        } else {
          const shopName = extractShopName(text)
          if (shopName) {
            setName(shopName)
            setCopyText(text)
          }
        }
      } catch {
        // 剪贴板权限被拒绝
      }
    }

    const timer = setTimeout(checkClipboard, 500)
    return () => clearTimeout(timer)
  }, [initialData])

  // 解析链接
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
        setSource(result.parsed.platform)
      } else if (result.parsed?.platform) {
        setSource(result.parsed.platform)
        setLinkError(null)
      } else {
        setLinkError(null)
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '识别失败'
      console.warn('[AddItemForm] 链接解析失败:', msg)
      setLinkError(null)
    }
    setLinkLoading(false)
  }

  function handleLinkChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newLink = e.target.value
    setLink(newLink)
    if (parseTimerRef.current) clearTimeout(parseTimerRef.current)
    if (newLink.trim() && isSupportedLink(newLink)) {
      parseTimerRef.current = setTimeout(() => doParseLink(newLink), 1500)
    } else {
      setLinkLoading(false)
    }
  }

  function handleManualParse() {
    if (parseTimerRef.current) clearTimeout(parseTimerRef.current)
    doParseLink(link)
  }

  function handleCopyTextChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const text = e.target.value
    setCopyText(text)
    const shopName = extractShopName(text)
    if (shopName && !name) setName(shopName)
    const addr = extractAddress(text)
    if (addr && !address) setAddress(addr)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return

    const common = {
      name: name.trim(),
      address: address.trim() || null,
      city: city.trim() || null,
      region: region.trim() || null,
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      rating: parseInt(rating),
      source,
      source_url: link.trim() || null,
      notes: notes.trim() || null,
      image_url: null,
    }

    if (itemType === 'food') {
      const food: FoodInsert = {
        ...common,
        type: 'food',
        price: price ? parseInt(price) : null,
        is_eaten: isEaten,
        revisit: initialData ? (initialData as Food).revisit ?? null : null,
      }
      onSubmit(food)
    } else {
      const place: PlaceInsert = {
        ...common,
        type: 'place',
        is_visited: isVisited,
      }
      onSubmit(place)
    }
    onClose()
  }

  const title = initialData
    ? `编辑${itemType === 'food' ? '美食' : '好玩'}`
    : `添加${itemType === 'food' ? '美食' : '好玩'}`

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[90dvh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* 名称 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {itemType === 'food' ? '店名/菜品名' : '地点名称'} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
              placeholder={itemType === 'food' ? '如：海底捞火锅' : '如：宽窄巷子'}
              required
            />
          </div>

          {/* 地址 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              📍 地址（点击可导航）
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="如：成都市锦江区春熙路"
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

          {/* 美食特有：价格 */}
          {itemType === 'food' && (
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
          )}

          {/* 评分 */}
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
              placeholder={itemType === 'food' ? '川菜, 麻辣, 火锅' : '古镇, 拍照, 文化'}
            />
          </div>

          {/* 推荐文案 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              📋 推荐文案（可选，自动提取名称）
            </label>
            <textarea
              value={copyText}
              onChange={handleCopyTextChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
              rows={2}
              placeholder="粘贴小红书/抖音的推荐文字，会自动识别名称和地址"
            />
          </div>

          {/* 状态开关 */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">
              {itemType === 'food' ? '✅ 已吃过' : '📍 已去过'}
            </span>
            <button
              type="button"
              onClick={() => itemType === 'food' ? setIsEaten(!isEaten) : setIsVisited(!isVisited)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                itemType === 'food' ? (isEaten ? 'bg-green-500' : 'bg-gray-300') : (isVisited ? 'bg-blue-500' : 'bg-gray-300')
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  itemType === 'food' ? (isEaten ? 'translate-x-5' : '') : (isVisited ? 'translate-x-5' : '')
                }`}
              />
            </button>
          </div>

          {/* 美食特有：二刷意愿 */}
          {itemType === 'food' && !initialData && (
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
          )}

          {/* 链接智能识别 */}
          <div className="border-t pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              🔗 来源链接（可选）
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={link}
                onChange={handleLinkChange}
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
