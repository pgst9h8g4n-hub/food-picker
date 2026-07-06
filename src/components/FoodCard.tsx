import { MapPin, Tag, Trash2, Check, Edit2, ThumbsUp, ThumbsDown, MinusCircle, Navigation, Map } from 'lucide-react'
import type { Food, Place, ItemType } from '@/types/db'

interface ItemCardProps {
  item: Food | Place
  type: ItemType
  onToggleEaten?: (id: string) => void
  onToggleVisited?: (id: string) => void
  onUpdateRevisit?: (id: string, revisit: 'would' | 'wouldnt' | 'neutral') => void
  onEdit: (item: Food | Place) => void
  onDelete: (id: string) => void
}

export default function ItemCard({ item, type, onToggleEaten, onToggleVisited, onUpdateRevisit, onEdit, onDelete }: ItemCardProps) {
  function getNavUrl() {
    if (!item.address) return ''
    return `https://uri.amap.com/search?keyword=${encodeURIComponent(item.address)}&callnative=1`
  }

  function cycleRevisit(current: string | null) {
    if (!current || current === 'neutral') return 'would'
    if (current === 'would') return 'wouldnt'
    if (current === 'wouldnt') return 'neutral'
    return 'would'
  }

  const isFood = type === 'food'
  const isEaten = isFood && (item as Food).is_eaten
  const isVisited = !isFood && (item as Place).is_visited

  return (
    <div
      className={`relative bg-white rounded-xl shadow-sm border p-4 transition-all hover:shadow-md ${
        isEaten ? 'opacity-60' : isVisited ? 'opacity-60' : ''
      }`}
    >
      {/* 状态标签 */}
      <div className="absolute top-2 right-2 flex gap-1">
        {isEaten && (
          <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
            <Check size={12} /> 已吃
          </span>
        )}
        {isVisited && (
          <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
            <Map size={12} /> 已去过
          </span>
        )}
        {isFood && (item as Food).revisit === 'would' && (
          <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
            <ThumbsUp size={12} /> 值得二刷
          </span>
        )}
        {isFood && (item as Food).revisit === 'wouldnt' && (
          <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
            <ThumbsDown size={12} /> 不推荐二刷
          </span>
        )}
        {isFood && (item as Food).revisit === 'neutral' && (
          <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
            <MinusCircle size={12} /> 无功无过
          </span>
        )}
      </div>

      <h3 className="font-semibold text-gray-900 text-lg pr-20 pt-1">{item.name}</h3>

      {/* 地址导航 */}
      {item.address && (
        <a
          href={getNavUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-blue-600 mt-1 hover:text-blue-800"
        >
          <Navigation size={12} /> {item.address}
        </a>
      )}

      <div className="flex flex-wrap gap-2 mt-2">
        {item.city && (
          <span className="inline-flex items-center gap-1 text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
            <MapPin size={12} /> {item.city}
          </span>
        )}
        {item.region && (
          <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
            {item.region}
          </span>
        )}
        {item.tags?.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 text-xs text-orange-700 bg-orange-50 px-2 py-1 rounded-full"
          >
            <Tag size={12} /> {tag}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-3">
          {isFood && (item as Food).price && (
            <span className="text-sm font-medium text-gray-700">¥{(item as Food).price}</span>
          )}
          {item.rating && (
            <span className="text-sm text-yellow-500">
              {'★'.repeat(item.rating)}{'☆'.repeat(5 - item.rating)}
            </span>
          )}
        </div>

        <div className="flex gap-1">
          {/* 美食：二刷意愿 */}
          {isFood && onUpdateRevisit && (
            <button
              onClick={() => onUpdateRevisit(item.id, cycleRevisit((item as Food).revisit))}
              className={`p-1.5 rounded-full transition-colors ${
                (item as Food).revisit === 'would'
                  ? 'text-blue-500 hover:bg-blue-50'
                  : (item as Food).revisit === 'wouldnt'
                  ? 'text-red-400 hover:bg-red-50'
                  : (item as Food).revisit === 'neutral'
                  ? 'text-gray-500 hover:bg-gray-50'
                  : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
              }`}
              title="切换二刷意愿"
            >
              {(item as Food).revisit === 'would' ? <ThumbsUp size={16} /> :
               (item as Food).revisit === 'wouldnt' ? <ThumbsDown size={16} /> :
               (item as Food).revisit === 'neutral' ? <MinusCircle size={16} /> :
               <ThumbsUp size={16} />}
            </button>
          )}
          {/* 状态切换 */}
          {isFood && onToggleEaten && (
            <button
              onClick={() => onToggleEaten(item.id)}
              className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors"
              title={isEaten ? '标记为未吃' : '标记为已吃'}
            >
              <Check size={16} />
            </button>
          )}
          {!isFood && onToggleVisited && (
            <button
              onClick={() => onToggleVisited(item.id)}
              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
              title={isVisited ? '标记为未去过' : '标记为已去过'}
            >
              <Map size={16} />
            </button>
          )}
          <button
            onClick={() => onEdit(item)}
            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
            title="编辑"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={() => onDelete(item.id)}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
            title="删除"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {item.notes && (
        <div className="mt-2">
          <p className="text-xs text-gray-400 line-clamp-1">{item.notes}</p>
        </div>
      )}
      {isFood && (item as Food).revisit && (
        <div className="mt-1">
          <span className={`text-xs px-1.5 py-0.5 rounded ${
            (item as Food).revisit === 'would' ? 'bg-blue-50 text-blue-600' :
            (item as Food).revisit === 'wouldnt' ? 'bg-red-50 text-red-600' :
            'bg-gray-100 text-gray-500'
          }`}>
            {(item as Food).revisit === 'would' ? '会二刷' :
             (item as Food).revisit === 'wouldnt' ? '不推荐二刷' :
             '无功无过'}
          </span>
        </div>
      )}
    </div>
  )
}
