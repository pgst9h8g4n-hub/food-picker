-- 更新 RLS 策略：两个用户互相可见
-- 用户 ID 1: c3f77262-aa84-4213-b75d-94b951de5ae8
-- 用户 ID 2: 7b908cd1-47a3-4977-8ebd-d2ef3c9f7f8a

DROP POLICY IF EXISTS "Users can view own foods" ON foods;
DROP POLICY IF EXISTS "Users can insert own foods" ON foods;
DROP POLICY IF EXISTS "Users can update own foods" ON foods;
DROP POLICY IF EXISTS "Users can delete own foods" ON foods;
DROP POLICY IF EXISTS "Users can view own history" ON random_history;
DROP POLICY IF EXISTS "Users can insert own history" ON random_history;

-- 两个用户都可以查看所有食物
CREATE POLICY "Both users can view foods"
  ON foods FOR SELECT
  USING (auth.uid() IN ('c3f77262-aa84-4213-b75d-94b951de5ae8', '7b908cd1-47a3-4977-8ebd-d2ef3c9f7f8a'));

-- 两个用户都可以插入食物
CREATE POLICY "Both users can insert foods"
  ON foods FOR INSERT
  WITH CHECK (auth.uid() IN ('c3f77262-aa84-4213-b75d-94b951de5ae8', '7b908cd1-47a3-4977-8ebd-d2ef3c9f7f8a'));

-- 两个用户都可以更新食物
CREATE POLICY "Both users can update foods"
  ON foods FOR UPDATE
  USING (auth.uid() IN ('c3f77262-aa84-4213-b75d-94b951de5ae8', '7b908cd1-47a3-4977-8ebd-d2ef3c9f7f8a'));

-- 两个用户都可以删除食物
CREATE POLICY "Both users can delete foods"
  ON foods FOR DELETE
  USING (auth.uid() IN ('c3f77262-aa84-4213-b75d-94b951de5ae8', '7b908cd1-47a3-4977-8ebd-d2ef3c9f7f8a'));

-- 两个用户都可以查看随机历史
CREATE POLICY "Both users can view history"
  ON random_history FOR SELECT
  USING (auth.uid() IN ('c3f77262-aa84-4213-b75d-94b951de5ae8', '7b908cd1-47a3-4977-8ebd-d2ef3c9f7f8a'));

-- 两个用户都可以插入随机历史
CREATE POLICY "Both users can insert history"
  ON random_history FOR INSERT
  WITH CHECK (auth.uid() IN ('c3f77262-aa84-4213-b75d-94b951de5ae8', '7b908cd1-47a3-4977-8ebd-d2ef3c9f7f8a'));
