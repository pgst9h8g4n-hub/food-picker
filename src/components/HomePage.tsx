import { useState, useEffect } from 'react'
import { Plus, List, Sparkles, LogOut, Clock, X, Edit2 } from 'lucide-react'
import { useAuth, useFoods, useHistory } from '@/lib/hooks'
import FoodCard from '@/components/FoodCard'
import AddFoodForm from '@/components/AddFoodForm'
import RandomPicker from '@/components/RandomPicker'
import type { Food, FoodInsert } from '@/types/db'

type Tab = 'collection' | 'picker'

export default function HomePage({ onLogout }: { onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState<Tab>('collection')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingFood, setEditingFood] = useState<Food | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const { signOut } = useAuth()
  const { foods, loading, error, fetchFoods, addFood, updateFood, deleteFood } = useFoods()
  const { history, record: recordHistoryFunc, fetchHistory } = useHistory()

  useEffect(() => {
    fetchFoods()
  }, [])

  useEffect(() => {
    fetchHistory()
  }, [])

  async function handleAddFood(food: FoodInsert) {
    const err = await addFood(food)
    if (!err) setShowAddForm(false)
  }

  async function handleEditFood(food: FoodInsert) {
    if (!editingFood) return
    const err = await updateFood(editingFood.id, food)
    if (!err) setEditingFood(null)
  }

  async function handleToggleEaten(id: string) {
    const food = foods.find((f) => f.id === id)
    if (food) {
      await updateFood(id, { is_eaten: !food.is_eaten })
    }
  }

  async function handleUpdateRevisit(id: string, revisit: 'would' | 'wouldnt') {
    await updateFood(id, { revisit })
  }

  async function handleDelete(id: string) {
    if (confirm('确定删除这道美食吗？')) {
      await deleteFood(id)
    }
  }

  async function handleRecordHistory(food: Food, city?: string, tags?: string[]) {
    await recordHistory(food, city, tags)
  }

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

        {/* Tab 切换 */}
        <div className="flex px-4 gap-1">
          <button
            onClick={() => setActiveTab('collection')}
            className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'collection'
                ? 'bg-orange-500 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <List size={16} /> 收藏列表
          </button>
          <button
            onClick={() => setActiveTab('picker')}
            className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'picker'
                ? 'bg-orange-500 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Sparkles size={16} /> 随机挑选
          </button>
        </div>
      </div>

      {/* 收藏列表 */}
      {activeTab === 'collection' && (
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-500">
              共 {foods.length} 道菜 · 已吃 {foods.filter((f) => f.is_eaten).length} 道
            </span>
            <button
              onClick={() => setShowAddForm(true)}
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
              {foods.map((food) => (
                <FoodCard
                  key={food.id}
                  food={food}
                  onToggleEaten={handleToggleEaten}
                  onUpdateRevisit={handleUpdateRevisit}
                  onEdit={setEditingFood}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}

          {!loading && foods.length === 0 && (
            <div className="text-center py-16">
              <p className="text-5xl mb-3">🍽️</p>
              <p className="text-gray-500 text-sm">还没有收藏任何美食</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="mt-4 bg-orange-500 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-orange-600"
              >
                添加第一道美食
              </button>
            </div>
          )}
        </div>
      )}

      {/* 随机挑选 */}
      {activeTab === 'picker' && (
        <RandomPicker foods={foods} onRecordHistory={handleRecordHistory} />
      )}

      {/* 添加美食弹窗 */}
      {showAddForm && (
        <AddFoodForm
          onSubmit={handleAddFood}
          onClose={() => setShowAddForm(false)}
          initialData={null}
        />
      )}

      {/* 编辑美食弹窗 */}
      {editingFood && (
        <AddFoodForm
          onSubmit={handleEditFood}
          onClose={() => setEditingFood(null)}
          initialData={editingFood}
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
