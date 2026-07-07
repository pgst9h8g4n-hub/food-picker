import { useState, useMemo } from 'react'
import { Sparkles, MapPin, Tag, Navigation } from 'lucide-react'
import type { Food, Place } from '@/types/db'
import { pickRandomFood, pickRandomPlace } from '@/lib/random'

interface RandomPickerProps {
  foods: Food[]
  places: Place[]
  onRecordHistory: (item: Food | Place, city?: string, tags?: string[]) => void
  itemType: 'food' | 'place'
}

export default function RandomPicker({ foods, places, onRecordHistory, itemType }: RandomPickerProps) {
  const [selectedCity, setSelectedCity] = useState('')
  const [selectedRegion, setSelectedRegion] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [excludeVisited, setExcludeVisited] = useState(true)
  const [result, setResult] = useState<Food | Place | null>(null)
  const [isSpinning, setIsSpinning] = useState(false)

  const items = itemType === 'food' ? foods : places
  const cities = useMemo(() => [...new Set(items.map((f) => f.city).filter(Boolean))] as string[], [items])
  const regions = useMemo(() => [...new Set(items.map((f) => f.region).filter(Boolean))] as string[], [items])
  const allTags = useMemo(() => items.flatMap((f) => f.tags ?? []).filter(Boolean), [items])
  const uniqueTags = useMemo(() => [...new Set(allTags)], [allTags])

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    )
  }

  async function handlePick() {
    if (items.length === 0) return

    setIsSpinning(true)
    setResult(null)

    let count = 0
    const maxCount = 20
    const interval = setInterval(() => {
      const temp = items[Math.floor(Math.random() * items.length)]
      setResult(temp)
      count++
      if (count >= maxCount) {
        clearInterval(interval)
        const options = {
          city: selectedCity || undefined,
          region: selectedRegion || undefined,
          tags: selectedTags.length > 0 ? selectedTags : undefined,
          excludeVisited: excludeVisited || undefined,
        }
        let final: Food | Place | null
        if (itemType === 'food') {
          final = pickRandomFood(foods, options)
        } else {
          final = pickRandomPlace(places, options)
        }
        setResult(final)
        setIsSpinning(false)
        if (final) onRecordHistory(final, selectedCity, selectedTags)
      }
    }, 80)
  }

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      {/* 筛选面板 */}
      <div className="bg-white rounded-2xl shadow-sm border p-4 mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">筛选条件</h3>

        <div className="mb-3">
          <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-1.5">
            <MapPin size={14} /> 城市
          </label>
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          >
            <option value="">全部城市</option>
            {cities.map((city) => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>

        <div className="mb-3">
          <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-1.5">
            <MapPin size={14} /> 区域
          </label>
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          >
            <option value="">全部区域</option>
            {regions.map((region) => (
              <option key={region} value={region}>{region}</option>
            ))}
          </select>
        </div>

        <div className="mb-3">
          <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-1.5">
            <Tag size={14} /> 标签
          </label>
          <div className="flex flex-wrap gap-1.5">
            {uniqueTags.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`px-2.5 py-1 text-xs rounded-full transition-colors ${
                  selectedTags.includes(tag)
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tag}
              </button>
            ))}
            {uniqueTags.length === 0 && (
              <span className="text-xs text-gray-400">暂无标签</span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">
            {itemType === 'food' ? '排除已吃过的' : '排除已去过的'}
          </span>
          <button
            onClick={() => setExcludeVisited(!excludeVisited)}
            className={`relative w-11 h-6 rounded-full transition-colors ${
              excludeVisited ? 'bg-orange-500' : 'bg-gray-300'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                excludeVisited ? 'translate-x-5' : ''
              }`}
            />
          </button>
        </div>
      </div>

      {/* 随机按钮 */}
      <button
        onClick={handlePick}
        disabled={isSpinning || items.length === 0}
        className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white py-4 rounded-2xl font-bold text-lg hover:from-orange-600 hover:to-amber-600 disabled:opacity-50 transition-all shadow-lg shadow-orange-200 flex items-center justify-center gap-2"
      >
        <Sparkles size={24} />
        {isSpinning ? '随机中...' : `随机选一个${itemType === 'food' ? '美食' : '好玩'}`}
      </button>

      {/* 结果展示 */}
      {result && (
        <div className={`mt-6 bg-white rounded-2xl shadow-lg border p-6 text-center transition-all ${
          isSpinning ? 'animate-pulse' : ''
        }`}>
          {!isSpinning && <div className="text-5xl mb-3">🎉</div>}
          <h3 className="text-2xl font-bold text-gray-900">{result.name}</h3>
          {result.address && (
            <a
              href={`https://uri.amap.com/search?keyword=${encodeURIComponent(result.name + ' ' + result.address)}&callnative=1`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 mt-1 flex items-center justify-center gap-1 hover:text-blue-800"
            >
              <Navigation size={14} /> {result.address}
            </a>
          )}
          {result.city && (
            <p className="text-sm text-gray-500 mt-1 flex items-center justify-center gap-1">
              <MapPin size={14} /> {result.city}
              {result.region && <span>· {result.region}</span>}
            </p>
          )}
          <div className="flex items-center justify-center gap-4 mt-3">
            {itemType === 'food' && (result as Food).price && (
              <span className="text-sm text-gray-600">¥{(result as Food).price}</span>
            )}
            {result.rating && (
              <span className="text-sm text-yellow-500">
                {'★'.repeat(result.rating)}{'☆'.repeat(5 - result.rating)}
              </span>
            )}
          </div>
          {result.tags && result.tags.length > 0 && (
            <div className="flex flex-wrap justify-center gap-1 mt-2">
              {result.tags.map((tag) => (
                <span key={tag} className="text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          )}
          {result.notes && (
            <p className="text-xs text-gray-400 mt-3">{result.notes}</p>
          )}

          {/* 操作按钮 */}
          {!isSpinning && (
            <div className="flex gap-3 mt-4">
              <button
                onClick={handlePick}
                className="flex-1 bg-orange-500 text-white py-2.5 rounded-xl font-medium hover:bg-orange-600 transition-colors text-sm"
              >
                换一个
              </button>
              {itemType === 'food' && (result as Food).is_eaten && (
                <span className="text-xs text-green-600 flex items-center gap-1 px-2">
                  ✅ 已吃过
                </span>
              )}
              {itemType !== 'food' && (result as Place).is_visited && (
                <span className="text-xs text-blue-600 flex items-center gap-1 px-2">
                  📍 已去过
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* 无数据提示 */}
      {items.length === 0 && (
        <div className="mt-8 text-center text-gray-400">
          <p className="text-4xl mb-2">{itemType === 'food' ? '🍽️' : '🎡'}</p>
          <p className="text-sm">还没有收藏任何{itemType === 'food' ? '美食' : '好玩'}</p>
        </div>
      )}

      {/* 无匹配数据提示 */}
      {items.length > 0 && result === null && !isSpinning && (
        <div className="mt-4 text-center text-gray-400 text-sm">
          当前筛选条件下没有可选项
        </div>
      )}
    </div>
  )
}
