import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import type { Food, FoodInsert } from '@/types/db'

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

  // 编辑模式下填充初始值
  useEffect(() => {
    if (initialData) {
      setName(initialData.name)
      setCity(initialData.city ?? '')
      setRegion(initialData.region ?? '')
      setTags((initialData.tags ?? []).join(', '))
      setPrice(initialData.price?.toString() ?? '')
      setRating((initialData.rating ?? 3).toString())
      setNotes(initialData.notes ?? '')
    }
  }, [initialData])

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
      source: null,
      source_url: null,
      notes: notes.trim() || null,
      is_eaten: false,
      revisit: null,
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
