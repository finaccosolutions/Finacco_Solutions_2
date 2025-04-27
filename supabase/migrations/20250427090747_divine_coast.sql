/*
  # Add admin flag to profiles table

  1. Changes
    - Add is_admin column to profiles table if it doesn't exist
    - Set default value to false
    - Update existing profiles to have is_admin = false
  
  2. Security
    - Maintain existing RLS policies
    - Only allow admin status to be modified by other admins
*/

-- Add is_admin column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_admin boolean DEFAULT false;
  END IF;
END $$;

-- Update existing profiles to have is_admin = false if null
UPDATE profiles SET is_admin = false WHERE is_admin IS NULL;

-- Add policy for admins to update other profiles' admin status
CREATE POLICY "Admins can update admin status"
ON profiles
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND is_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND is_admin = true
  )
);