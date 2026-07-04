import { createClient } from '@supabase/supabase-js'
import type { Food, FoodInsert, FoodUpdate } from '@/types/db'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

// 导出类型用于类型推断
export type { Food, FoodInsert, FoodUpdate }
