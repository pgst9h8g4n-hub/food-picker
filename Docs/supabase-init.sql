-- ============================================
-- 美食收藏与随机选择 — 数据库初始化脚本
-- ============================================
-- 在 Supabase SQL Editor 中运行此脚本
-- ============================================

-- 1. 美食表
CREATE TABLE IF NOT EXISTS foods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  name TEXT NOT NULL,
  city TEXT,
  region TEXT,
  tags TEXT[],
  price INTEGER,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  source TEXT,
  source_url TEXT,
  notes TEXT,
  is_eaten BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 随机历史表
CREATE TABLE IF NOT EXISTS random_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  food_id UUID NOT NULL REFERENCES foods(id),
  filter_city TEXT,
  filter_tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 启用 RLS
ALTER TABLE foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE random_history ENABLE ROW LEVEL SECURITY;

-- 4. Foods RLS 策略
-- 用户只能查看自己的数据
CREATE POLICY "Users can view own foods"
  ON foods FOR SELECT
  USING (auth.uid() = user_id);

-- 用户只能插入自己的数据
CREATE POLICY "Users can insert own foods"
  ON foods FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 用户只能更新自己的数据
CREATE POLICY "Users can update own foods"
  ON foods FOR UPDATE
  USING (auth.uid() = user_id);

-- 用户只能删除自己的数据
CREATE POLICY "Users can delete own foods"
  ON foods FOR DELETE
  USING (auth.uid() = user_id);

-- 5. Random History RLS 策略
CREATE POLICY "Users can view own history"
  ON random_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own history"
  ON random_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 6. 自动更新 updated_at 触发器
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_foods_updated_at
  BEFORE UPDATE ON foods
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
