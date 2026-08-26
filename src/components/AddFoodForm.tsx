import { useState, useEffect, useRef } from 'react'
import { X, ClipboardPaste } from 'lucide-react'
import type { Food, Place, FoodInsert, PlaceInsert, ItemType } from '@/types/db'
import { detectClipboardContent, extractShopName, extractAddress } from '@/lib/link-parser'
import type { ParsedPlace } from '@/lib/link-parser'

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
  const [parsedInfo, setParsedInfo] = useState<ParsedPlace | null>(null)
  const [hasPendingClipboard, setHasPendingClipboard] = useState(false)
  const [isEaten, setIsEaten] = useState(false)
  const [isVisited, setIsVisited] = useState(false)

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
        if (!text || text.trim().length < 3) return

        const result = detectClipboardContent(text)

        if (result.isLink) {
          // 检测到链接
          setLink(text.trim())
          setParsedInfo(result.parsed ?? null)
          setSource(result.parsed?.source ?? null)
          setHasPendingClipboard(true)
          // 如果有城市信息，自动填入
          if (result.parsed?.city && !city) setCity(result.parsed.city)
        } else if (result.parsed?.title) {
          // 检测到分享文本
          setName(result.parsed.title)
          setCopyText(text)
          if (result.parsed.address && !address) setAddress(result.parsed.address)
          if (result.parsed.city && !city) setCity(result.parsed.city)
        }
      } catch {
        // 剪贴板权限被拒绝或不可用
      }
    }

    // 延迟检测，给页面加载时间
    const timer = setTimeout(checkClipboard, 800)
    return () => clearTimeout(timer)
  }, [initialData])

  // 解析链接 - 从 URL 提取信息
  async function doParseLink(url: string) {
    if (!url.trim()) return
    setLinkLoading(true)
    setLinkError(null)
    try {
      const result = detectClipboardContent(url.trim())
      if (result.parsed) {
        setParsedInfo(result.parsed)
        setSource(result.parsed.source)
        setLinkError(null)
        // 如果有城市信息，自动填入
        if (result.parsed.city && !city) setCity(result.parsed.city)
        // 如果有标题，自动填入
        if (result.parsed.title && !name) setName(result.parsed.title)
      } else {
        setParsedInfo(null)
        setLinkError('暂无法从此链接提取信息，请手动填写或粘贴推荐文案')
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '识别失败'
      console.warn('[AddItemForm] 链接解析失败:', msg)
      setLinkError('解析失败')
    }
    setLinkLoading(false)
  }

  function handleLinkChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newLink = e.target.value
    setLink(newLink)
    setParsedInfo(null)
    if (parseTimerRef.current) clearTimeout(parseTimerRef.current)
    if (newLink.trim() && isSupportedLink(newLink)) {
      // 自动解析，无需手动点击
      parseTimerRef.current = setTimeout(() => doParseLink(newLink), 800)
    } else {
      setLinkLoading(false)
    }
  }

  function handleManualParse() {
    if (parseTimerRef.current) clearTimeout(parseTimerRef.current)
    doParseLink(link)
  }

  async function handlePasteFromClipboard() {
    try {
      const text = await navigator.clipboard.readText()
      if (!text || text.trim().length < 3) return

      const result = detectClipboardContent(text.trim())
      setHasPendingClipboard(false)

      if (result.isLink && result.parsed) {
        setLink(result.parsed.rawText)
        setParsedInfo(result.parsed)
        setSource(result.parsed.source)
        if (result.parsed.city && !city) setCity(result.parsed.city)
        if (result.parsed.title && !name) setName(result.parsed.title)
      } else if (result.parsed?.title) {
        setName(result.parsed.title)
        setCopyText(text)
        if (result.parsed.address && !address) setAddress(result.parsed.address)
        if (result.parsed.city && !city) setCity(result.parsed.city)
        if (result.parsed.rating) setRating(result.parsed.rating.toString())
      }
    } catch {
      // 剪贴板权限被拒绝
    }
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
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium text-gray-700">
                🔗 来源链接（可选）
              </label>
              <button
                type="button"
                onClick={handlePasteFromClipboard}
                className="text-xs text-purple-600 hover:text-purple-700 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-purple-50 transition-colors"
              >
                <ClipboardPaste size={12} />
                粘贴剪贴板
              </button>
            </div>
            <div className="flex gap-2">
              <input
                type="url"
                value={link}
                onChange={handleLinkChange}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                placeholder="小红书/抖音/美团链接"
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

            {/* 解析结果提示 */}
            {parsedInfo && (
              <div className="mt-2 p-3 bg-purple-50 rounded-lg border border-purple-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-purple-700">
                    {parsedInfo.platform === '分享文本' ? '📋 检测到分享信息' : `🔗 ${parsedInfo.platform}链接`}
                  </span>
                  <button
                    type="button"
                    onClick={() => setParsedInfo(null)}
                    className="text-purple-400 hover:text-purple-600 text-xs"
                  >
                    ✕
                  </button>
                </div>
                {parsedInfo.title && (
                  <p className="text-sm font-medium text-gray-800 mt-1">
                    {parsedInfo.title}
                  </p>
                )}
                {parsedInfo.city && (
                  <p className="text-xs text-purple-600 mt-1">
                    📍 城市：{parsedInfo.city}
                  </p>
                )}
                {parsedInfo.address && (
                  <p className="text-xs text-purple-600 mt-1">
                    🏠 地址：{parsedInfo.address}
                  </p>
                )}
                {parsedInfo.price && (
                  <p className="text-xs text-purple-600 mt-1">
                    💰 参考价：¥{parsedInfo.price}
                  </p>
                )}
                {parsedInfo.rating && (
                  <p className="text-xs text-purple-600 mt-1">
                    ⭐ 评分：{parsedInfo.rating}星
                  </p>
                )}
                {parsedInfo.rawText && !parsedInfo.title && (
                  <p className="text-xs text-gray-500 mt-1 truncate">
                    {parsedInfo.rawText.length > 50 ? parsedInfo.rawText.slice(0, 50) + '...' : parsedInfo.rawText}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* 一键粘贴提示 - 当剪贴板有待处理内容时显示 */}
          {hasPendingClipboard && !name && !link && (
            <div className="border-t pt-4">
              <button
                type="button"
                onClick={handlePasteFromClipboard}
                className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 hover:from-orange-600 hover:to-amber-600 transition-all"
              >
                <ClipboardPaste size={18} />
                粘贴并识别分享信息
              </button>
            </div>
          )}

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
