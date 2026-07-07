-- 更新 RLS 策略：所有已登录用户互相可见（两人共享）
-- 不再硬编码用户 ID，任何已登录用户都可以读写所有记录

DROP POLICY IF EXISTS "Both users can view foods" ON foods;
DROP POLICY IF EXISTS "Both users can insert foods" ON foods;
DROP POLICY IF EXISTS "Both users can update foods" ON foods;
DROP POLICY IF EXISTS "Both users can delete foods" ON foods;

CREATE POLICY "Anyone can view foods"
  ON foods FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can insert foods"
  ON foods FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update foods"
  ON foods FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can delete foods"
  ON foods FOR DELETE
  TO authenticated
  USING (true);

-- History
DROP POLICY IF EXISTS "Both users can view history" ON random_history;
DROP POLICY IF EXISTS "Both users can insert history" ON random_history;

CREATE POLICY "Anyone can view history"
  ON random_history FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can insert history"
  ON random_history FOR INSERT
  TO authenticated
  WITH CHECK (true);
