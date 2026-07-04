-- 新增 image_url 字段到 foods 表
ALTER TABLE foods ADD COLUMN IF NOT EXISTS image_url TEXT;
CREATE INDEX IF NOT EXISTS idx_foods_image ON foods(image_url) WHERE image_url IS NOT NULL;

-- ============================================
-- Storage Bucket: food-images 配置
-- 在 Supabase Dashboard → Storage 手动创建 bucket "food-images"
-- 然后运行以下 RLS 策略
-- ============================================

-- 允许 authenticated 用户上传自己的图片
CREATE POLICY "Users can upload own images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'food-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- 允许 authenticated 用户查看 bucket 中的所有图片
CREATE POLICY "Users can view images"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'food-images');

-- 允许用户上传用户更新自己的图片
CREATE POLICY "Users can update own images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'food-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- 允许用户上传用户删除自己的图片
CREATE POLICY "Users can delete own images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'food-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
