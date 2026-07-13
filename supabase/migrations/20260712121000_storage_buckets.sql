-- Migration: Buckets para user-avatars e user-qrcodes
-- Ordem: pós-deploy

INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES
  ('user-avatars', 'user-avatars', true, false, 5242880, '{image/png,image/jpeg,image/webp}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES
  ('user-qrcodes', 'user-qrcodes', true, false, 2097152, '{image/png,image/jpeg,image/webp}')
ON CONFLICT (id) DO NOTHING;

-- Políticas para user-avatars (SELECT público, INSERT/UPDATE owner + admin)
CREATE POLICY "avatars_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'user-avatars');

CREATE POLICY "avatars_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'user-avatars'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "avatars_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'user-avatars'
    AND (auth.uid() = owner OR EXISTS (
      SELECT 1 FROM user_profiles p
      LEFT JOIN custom_roles cr ON cr.id = p.custom_role_id
      WHERE p.id = auth.uid()
      AND (cr.permissions @> '["canManageUsers"]'::jsonb OR p.role = 'admin')
    ))
  );

CREATE POLICY "avatars_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'user-avatars'
    AND (auth.uid() = owner OR EXISTS (
      SELECT 1 FROM user_profiles p
      LEFT JOIN custom_roles cr ON cr.id = p.custom_role_id
      WHERE p.id = auth.uid()
      AND (cr.permissions @> '["canManageUsers"]'::jsonb OR p.role = 'admin')
    ))
  );

-- Políticas para user-qrcodes (SELECT autenticado, INSERT/UPDATE owner + admin)
CREATE POLICY "qrcodes_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'user-qrcodes' AND auth.role() = 'authenticated');

CREATE POLICY "qrcodes_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'user-qrcodes'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "qrcodes_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'user-qrcodes'
    AND (auth.uid() = owner OR EXISTS (
      SELECT 1 FROM user_profiles p
      LEFT JOIN custom_roles cr ON cr.id = p.custom_role_id
      WHERE p.id = auth.uid()
      AND (cr.permissions @> '["canManageUsers"]'::jsonb OR p.role = 'admin')
    ))
  );

CREATE POLICY "qrcodes_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'user-qrcodes'
    AND (auth.uid() = owner OR EXISTS (
      SELECT 1 FROM user_profiles p
      LEFT JOIN custom_roles cr ON cr.id = p.custom_role_id
      WHERE p.id = auth.uid()
      AND (cr.permissions @> '["canManageUsers"]'::jsonb OR p.role = 'admin')
    ))
  );
