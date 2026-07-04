/**
 * 加权随机算法
 * 使用指数权重（2^rating），评分越高的食物被选中的概率越大
 * 5星食物的权重是1星的16倍，但不是100%被选中
 */
import type { Food } from '@/types/db'

export interface RandomOptions {
  city?: string
  tags?: string[]
  minPrice?: number
  maxPrice?: number
  excludeEaten?: boolean
}

/**
 * 过滤候选食物
 */
function filterFoods(foods: Food[], options: RandomOptions): Food[] {
  return foods.filter((food) => {
    if (options.excludeEaten && food.is_eaten) return false
    if (options.city && food.city !== options.city) return false
    if (options.tags && options.tags.length > 0) {
      if (!food.tags || food.tags.some((tag) => options.tags!.includes(tag))) {
        // 有标签筛选时：如果食物有任一匹配的标签则保留
        // 如果没有标签字段，则跳过
        if (!food.tags) return false
      } else {
        return false
      }
    }
    if (options.minPrice != null && (food.price ?? 0) < options.minPrice) return false
    if (options.maxPrice != null && (food.price ?? 0) > options.maxPrice) return false
    return true
  })
}

/**
 * 指数加权随机选择
 */
export function pickRandom(foods: Food[], options: RandomOptions = {}): Food | null {
  const candidates = filterFoods(foods, options)

  if (candidates.length === 0) return null
  if (candidates.length === 1) return candidates[0]

  // 指数权重：2^(rating-1)，rating 1~5 对应权重 1,2,4,8,16
  const totalWeight = candidates.reduce(
    (sum, food) => sum + Math.pow(2, (food.rating ?? 1) - 1),
    0,
  )

  let random = Math.random() * totalWeight
  for (const food of candidates) {
    const weight = Math.pow(2, (food.rating ?? 1) - 1)
    random -= weight
    if (random <= 0) return food
  }

  // 浮点误差兜底
  return candidates[candidates.length - 1]
}

/**
 * 计算权重分布（用于调试/展示）
 */
export function getWeightDistribution(foods: Food[]): Record<number, number> {
  const dist: Record<number, number> = {}
  for (let i = 1; i <= 5; i++) {
    const ratingFoods = foods.filter((f) => f.rating === i)
    const totalWeight = ratingFoods.reduce((sum, f) => sum + Math.pow(2, i - 1), 0)
    dist[i] = totalWeight
  }
  return dist
}
