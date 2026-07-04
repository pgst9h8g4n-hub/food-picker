import { MapPin, Tag, Trash2, Check, Edit2, ThumbsUp, ThumbsDown } from 'lucide-react'
import type { Food } from '@/types/db'

interface FoodCardProps {
  food: Food
  onToggleEaten: (id: string) => void
  onUpdateRevisit: (id: string, revisit: 'would' | 'wouldnt') => void
  onEdit: (food: Food) => void
  onDelete: (id: string) => void
}

export default function FoodCard({ food, onToggleEaten, onUpdateRevisit, onEdit, onDelete }: FoodCardProps) {
  return (
    <div
      className={`relative bg-white rounded-xl shadow-sm border p-4 transition-all hover:shadow-md ${
        food.is_eaten ? 'opacity-60' : ''
      }`}
    >
      {/* 图片 */}
      {food.image_url && (
        <div className="mb-3">
          <img
            src={food.image_url}
            alt={food.name}
            className="w-full h-40 object-cover rounded-lg"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
        </div>
      )}

      {/* 状态标签 */}
      <div className="absolute top-2 right-2 flex gap-1">
        {food.is_eaten && (
          <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
            <Check size={12} /> 已吃
          </span>
        )}
        {food.revisit === 'would' && (
          <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
            <ThumbsUp size={12} /> 值得二刷
          </span>
        )}
        {food.revisit === 'wouldnt' && (
          <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
            <ThumbsDown size={12} /> 不推荐二刷
          </span>
        )}
      </div>

      <h3 className="font-semibold text-gray-900 text-lg pr-20 pt-1">{food.name}</h3>

      <div className="flex flex-wrap gap-2 mt-2">
        {food.city && (
          <span className="inline-flex items-center gap-1 text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
            <MapPin size={12} /> {food.city}
          </span>
        )}
        {food.region && (
          <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
            {food.region}
          </span>
        )}
        {food.tags?.map((tag) => (
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
          {food.price && (
            <span className="text-sm font-medium text-gray-700">¥{food.price}</span>
          )}
          {food.rating && (
            <span className="text-sm text-yellow-500">
              {'★'.repeat(food.rating)}{'☆'.repeat(5 - food.rating)}
            </span>
          )}
        </div>

        <div className="flex gap-1">
          <button
            onClick={() => food.revisit === 'would' ? onUpdateRevisit(food.id, 'wouldnt') : onUpdateRevisit(food.id, 'would')}
            className={`p-1.5 rounded-full transition-colors ${
              food.revisit === 'would'
                ? 'text-blue-500 hover:bg-blue-50'
                : food.revisit === 'wouldnt'
                ? 'text-red-400 hover:bg-red-50'
                : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
            }`}
            title={food.revisit ? '切换二刷意愿' : '标记二刷意愿'}
          >
            {food.revisit === 'would' ? <ThumbsUp size={16} /> : food.revisit === 'wouldnt' ? <ThumbsDown size={16} /> : <ThumbsUp size={16} />}
          </button>
          <button
            onClick={() => onEdit(food)}
            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
            title="编辑"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={() => onToggleEaten(food.id)}
            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors"
            title={food.is_eaten ? '标记为未吃' : '标记为已吃'}
          >
            <Check size={16} />
          </button>
          <button
            onClick={() => onDelete(food.id)}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
            title="删除"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {(food.notes || food.revisit) && (
        <div className="mt-2 flex flex-wrap gap-1">
          {food.notes && (
            <p className="text-xs text-gray-400 line-clamp-1">{food.notes}</p>
          )}
          {food.revisit && (
            <span className={`text-xs px-1.5 py-0.5 rounded ${
              food.revisit === 'would' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'
            }`}>
              {food.revisit === 'would' ? '会二刷' : '不推荐二刷'}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
