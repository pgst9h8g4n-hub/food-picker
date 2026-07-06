/**
 * 美食收藏与随机选择 — 数据库类型定义
 */

export type ItemType = 'food' | 'place'

export interface Food {
  id: string
  user_id: string
  type: 'food'
  name: string
  city: string | null
  region: string | null
  address: string | null  // 详细地址（用于导航）
  tags: string[] | null
  price: number | null
  rating: number | null
  source: string | null
  source_url: string | null
  notes: string | null
  image_url: string | null
  is_eaten: boolean
  revisit: 'would' | 'wouldnt' | 'neutral' | null  // 是否愿意二次光顾：会/不会/无功无过
  created_at: string
  updated_at: string
}

export type FoodInsert = Omit<Food, 'id' | 'user_id' | 'created_at' | 'updated_at'>
export type FoodUpdate = Partial<FoodInsert>

export interface Place {
  id: string
  user_id: string
  type: 'place'
  name: string
  city: string | null
  region: string | null
  address: string | null
  tags: string[] | null
  rating: number | null
  source: string | null
  source_url: string | null
  notes: string | null
  image_url: string | null
  is_visited: boolean  // 是否去过
  created_at: string
  updated_at: string
}

export type PlaceInsert = Omit<Place, 'id' | 'user_id' | 'created_at' | 'updated_at'>
export type PlaceUpdate = Partial<PlaceInsert>

export type Item = Food | Place

export interface RandomFilter {
  city?: string
  tags?: string[]
  minPrice?: number
  maxPrice?: number
  excludeVisited?: boolean  // 排除已去过（对美食是 excludeEaten，对好玩是 excludeVisited）
}
