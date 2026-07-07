/**
 * 加权随机算法
 * 支持美食（Food）和好玩地点（Place）
 * 使用指数权重（2^rating），评分越高的被选中的概率越大
 */
import type { Food, Place } from '@/types/db'

export interface RandomOptions {
  city?: string
  region?: string
  tags?: string[]
  excludeVisited?: boolean  // 排除已去过/已吃过
}

/**
 * 过滤候选美食
 */
export function filterFoods(foods: Food[], options: RandomOptions): Food[] {
  return foods.filter((food) => {
    if (options.excludeVisited && food.is_eaten) return false
    if (options.city && food.city !== options.city) return false
    if (options.region && food.region !== options.region) return false
    if (options.tags && options.tags.length > 0) {
      if (!food.tags) return false
      if (!food.tags.some((tag) => options.tags!.includes(tag))) return false
    }
    return true
  })
}

/**
 * 过滤候选好玩地点
 */
export function filterPlaces(places: Place[], options: RandomOptions): Place[] {
  return places.filter((place) => {
    if (options.excludeVisited && place.is_visited) return false
    if (options.city && place.city !== options.city) return false
    if (options.region && place.region !== options.region) return false
    if (options.tags && options.tags.length > 0) {
      if (!place.tags) return false
      if (!place.tags.some((tag) => options.tags!.includes(tag))) return false
    }
    return true
  })
}

/**
 * 指数加权随机选择美食
 */
export function pickRandomFood(foods: Food[], options: RandomOptions = {}): Food | null {
  const candidates = filterFoods(foods, options)
  return weightedPick(candidates)
}

/**
 * 指数加权随机选择好玩地点
 */
export function pickRandomPlace(places: Place[], options: RandomOptions = {}): Place | null {
  const candidates = filterPlaces(places, options)
  return weightedPick(candidates)
}

/**
 * 通用指数加权随机
 */
function weightedPick<T extends { rating: number | null }>(items: T[]): T | null {
  if (items.length === 0) return null
  if (items.length === 1) return items[0]

  const totalWeight = items.reduce(
    (sum, item) => sum + Math.pow(2, (item.rating ?? 1) - 1),
    0,
  )

  let random = Math.random() * totalWeight
  for (const item of items) {
    const weight = Math.pow(2, (item.rating ?? 1) - 1)
    random -= weight
    if (random <= 0) return item
  }

  return items[items.length - 1]
}
