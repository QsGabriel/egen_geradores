-- ============================================
-- EGEN System - Proposal Covers Storage
-- Migration: Create storage bucket for proposal cover images
-- ============================================

-- Create storage bucket for proposal cover images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'proposal-covers',
  'proposal-covers',
  true,
  5242880, -- 5MB limit
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- STORAGE POLICIES
-- ============================================

-- Allow authenticated users to SELECT (read) all covers
CREATE POLICY "Allow authenticated SELECT on proposal-covers"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'proposal-covers');

-- Allow authenticated users to INSERT (upload) covers
CREATE POLICY "Allow authenticated INSERT on proposal-covers"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'proposal-covers');

-- Allow authenticated users to UPDATE their own covers
CREATE POLICY "Allow authenticated UPDATE on proposal-covers"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'proposal-covers');

-- Allow authenticated users to DELETE their own covers
CREATE POLICY "Allow authenticated DELETE on proposal-covers"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'proposal-covers');
