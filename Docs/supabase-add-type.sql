-- 新增 type 字段，区分美食和好玩地点
ALTER TABLE foods ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'food';

-- 好玩地点：是否去过
ALTER TABLE foods ADD COLUMN IF NOT EXISTS is_visited BOOLEAN DEFAULT FALSE;

-- 索引
CREATE INDEX IF NOT EXISTS idx_foods_type ON foods(type);
CREATE INDEX IF NOT EXISTS idx_foods_type_is_eaten ON foods(type, is_eaten) WHERE type = 'food';
CREATE INDEX IF NOT EXISTS idx_foods_type_is_visited ON foods(type, is_visited) WHERE type = 'place';
