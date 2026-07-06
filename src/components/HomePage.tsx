import { useState, useEffect } from 'react'
import { Plus, List, Sparkles, LogOut, Clock, X } from 'lucide-react'
import { useAuth, useFoods, useHistory, usePlaces } from '@/lib/hooks'
import ItemCard from '@/components/FoodCard'
import AddItemForm from '@/components/AddFoodForm'
import RandomPicker from '@/components/RandomPicker'
import type { Food, Place, FoodInsert, PlaceInsert } from '@/types/db'

type MainTab = 'collection' | 'picker'
type ItemType = 'food' | 'place'

export default function HomePage({ onLogout }: { onLogout: () => void }) {
  const [activeMainTab, setActiveMainTab] = useState<MainTab>('collection')
  const [activeItemType, setActiveItemType] = useState<ItemType>('food')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingItem, setEditingItem] = useState<Food | Place | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const { signOut } = useAuth()
  const { foods, loading: foodsLoading, error: foodsError, fetchFoods, addFood, updateFood, deleteFood } = useFoods()
  const { places, loading: placesLoading, error: placesError, fetchPlaces, addPlace, updatePlace, deletePlace } = usePlaces()
  const { history, record: recordHistory, fetchHistory } = useHistory()

  useEffect(() => {
    fetchFoods()
  }, [])

  useEffect(() => {
    fetchPlaces()
  }, [])

  useEffect(() => {
    fetchHistory()
  }, [])

  async function handleAddItem(item: FoodInsert | PlaceInsert) {
    if (item.type === 'food') {
      const err = await addFood(item as FoodInsert)
      if (!err) setShowAddForm(false)
    } else {
      const err = await addPlace(item as PlaceInsert)
      if (!err) setShowAddForm(false)
    }
  }

  async function handleEditItem(item: FoodInsert | PlaceInsert) {
    if (!editingItem) return
    if (item.type === 'food') {
      const err = await updateFood(editingItem.id, item as FoodInsert)
      if (!err) setEditingItem(null)
    } else {
      const err = await updatePlace(editingItem.id, item as PlaceInsert)
      if (!err) setEditingItem(null)
    }
  }

  async function handleToggleEaten(id: string) {
    const food = foods.find((f) => f.id === id)
    if (food) {
      await updateFood(id, { is_eaten: !food.is_eaten })
    }
  }

  async function handleToggleVisited(id: string) {
    const place = places.find((p) => p.id === id)
    if (place) {
      await updatePlace(id, { is_visited: !place.is_visited })
    }
  }

  async function handleUpdateRevisit(id: string, revisit: 'would' | 'wouldnt' | 'neutral') {
    await updateFood(id, { revisit })
  }

  async function handleDelete(id: string) {
    if (confirm('确定删除这个项目吗？')) {
      await deleteFood(id)
      await deletePlace(id)
    }
  }

  async function handleRecordHistory(item: Food | Place, city?: string, tags?: string[]) {
    await recordHistory(item as Food, city, tags)
  }

  const loading = activeItemType === 'food' ? foodsLoading : placesLoading
  const error = activeItemType === 'food' ? foodsError : placesError
  const items = activeItemType === 'food' ? foods : places
  const itemCount = activeItemType === 'food' ? foods.length : places.length
  const eatenCount = activeItemType === 'food' ? foods.filter((f) => f.is_eaten).length : places.filter((p) => p.is_visited).length

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 顶部导航 */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-lg font-bold text-gray-900">🍜 美食收藏</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="text-sm text-gray-500 flex items-center gap-1 hover:text-gray-700"
            >
              <Clock size={16} /> 历史
            </button>
            <button
              onClick={() => signOut().then(onLogout)}
              className="text-sm text-gray-500 flex items-center gap-1 hover:text-gray-700"
            >
              <LogOut size={16} /> 退出
            </button>
          </div>
        </div>

        {/* 主 Tab：收藏列表 / 随机挑选 */}
        <div className="flex px-4 gap-1">
          <button
            onClick={() => setActiveMainTab('collection')}
            className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              activeMainTab === 'collection'
                ? 'bg-orange-500 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <List size={16} /> 收藏列表
          </button>
          <button
            onClick={() => setActiveMainTab('picker')}
            className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              activeMainTab === 'picker'
                ? 'bg-orange-500 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Sparkles size={16} /> 随机挑选
          </button>
        </div>
      </div>

      {/* 收藏列表 */}
      {activeMainTab === 'collection' && (
        <div className="p-4">
          {/* 美食 / 好玩 子 Tab */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setActiveItemType('food')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeItemType === 'food'
                  ? 'bg-orange-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border'
              }`}
            >
              🍜 美食
            </button>
            <button
              onClick={() => setActiveItemType('place')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeItemType === 'place'
                  ? 'bg-teal-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border'
              }`}
            >
              🎡 好玩
            </button>
          </div>

          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-500">
              共 {itemCount} 个{activeItemType === 'food' ? '道' : '个'} · {activeItemType === 'food' ? '已吃' : '去过'} {eatenCount} 个
            </span>
            <button
              onClick={() => { setShowAddForm(true); setEditingItem(null) }}
              className="bg-orange-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-orange-600 flex items-center gap-1"
            >
              <Plus size={16} /> 添加
            </button>
          </div>

          {loading && (
            <div className="text-center py-12 text-gray-400">
              <p className="text-sm">加载中...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">
              {error}
            </div>
          )}

          {!loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {items.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  type={activeItemType}
                  onToggleEaten={activeItemType === 'food' ? handleToggleEaten : undefined}
                  onToggleVisited={activeItemType === 'place' ? handleToggleVisited : undefined}
                  onUpdateRevisit={activeItemType === 'food' ? handleUpdateRevisit : undefined}
                  onEdit={(i) => { setEditingItem(i); setShowAddForm(true) }}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}

          {!loading && items.length === 0 && (
            <div className="text-center py-16">
              <p className="text-5xl mb-3">{activeItemType === 'food' ? '🍽️' : '🎡'}</p>
              <p className="text-gray-500 text-sm">还没有收藏任何{activeItemType === 'food' ? '美食' : '好玩'}</p>
              <button
                onClick={() => { setShowAddForm(true); setEditingItem(null) }}
                className="mt-4 bg-orange-500 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-orange-600"
              >
                添加第一个
              </button>
            </div>
          )}
        </div>
      )}

      {/* 随机挑选 */}
      {activeMainTab === 'picker' && (
        <RandomPicker
          foods={foods}
          places={places}
          onRecordHistory={async (item, city, tags) => {
            await recordHistory(item as Food, city, tags)
          }}
          itemType={activeItemType}
        />
      )}

      {/* 添加弹窗 */}
      {showAddForm && !editingItem && (
        <AddItemForm
          onSubmit={handleAddItem}
          onClose={() => setShowAddForm(false)}
          initialData={null}
          itemType={activeItemType}
        />
      )}

      {/* 编辑弹窗 */}
      {editingItem && showAddForm && (
        <AddItemForm
          onSubmit={handleEditItem}
          onClose={() => { setEditingItem(null); setShowAddForm(false) }}
          initialData={editingItem}
          itemType={editingItem.type}
        />
      )}

      {/* 随机历史面板 */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50">
          <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[80dvh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold">随机历史</h2>
              <button onClick={() => setShowHistory(false)} className="p-1 hover:bg-gray-100 rounded-full">
                <X size={20} />
              </button>
            </div>
            <div className="p-4">
              {history.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p className="text-4xl mb-2">📝</p>
                  <p className="text-sm">还没有随机记录</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {history.map((item: any) => (
                    <div key={item.id} className="bg-gray-50 rounded-xl p-3">
                      <p className="font-medium text-gray-900">{item.foods?.name || '未知'}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        {item.foods?.city && (
                          <span>{item.foods.city}</span>
                        )}
                        {item.foods?.rating && (
                          <span className="text-yellow-500">
                            {'★'.repeat(item.foods.rating)}{'☆'.repeat(5 - item.foods.rating)}
                          </span>
                        )}
                        <span>{new Date(item.created_at).toLocaleString('zh-CN')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
