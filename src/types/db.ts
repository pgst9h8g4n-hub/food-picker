/**
 * 美食收藏与随机选择 — 数据库类型定义
 */

export interface Food {
  id: string
  user_id: string
  name: string
  city: string | null
  region: string | null
  tags: string[] | null
  price: number | null
  rating: number | null
  source: string | null
  source_url: string | null
  notes: string | null
  image_url: string | null  // 美食图片 URL（Supabase Storage 或外链）
  is_eaten: boolean
  revisit: 'would' | 'wouldnt' | null  // 是否愿意二次光顾
  created_at: string
  updated_at: string
}

export type FoodInsert = Omit<Food, 'id' | 'user_id' | 'created_at' | 'updated_at'>

export type FoodUpdate = Partial<FoodInsert>

export interface RandomFilter {
  city?: string
  tags?: string[]
  minPrice?: number
  maxPrice?: number
  excludeEaten?: boolean
}
