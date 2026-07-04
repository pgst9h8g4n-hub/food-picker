-- 新增 revisit 字段到 foods 表
ALTER TABLE foods ADD COLUMN IF NOT EXISTS revisit TEXT;

-- 添加索引加速查询
CREATE INDEX IF NOT EXISTS idx_foods_city ON foods(city) WHERE city IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_foods_rating ON foods(rating) WHERE rating IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_foods_is_eaten ON foods(is_eaten);
CREATE INDEX IF NOT EXISTS idx_foods_revisit ON foods(revisit) WHERE revisit IS NOT NULL;
