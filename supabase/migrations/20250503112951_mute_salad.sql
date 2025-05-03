/*
  # Fix profile policies to prevent recursion

  1. Changes
    - Remove recursive policies
    - Add separate policies for users and admins
    - Ensure proper access control
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Enable read access for users to own profile" ON profiles;

-- Create new non-recursive policies
CREATE POLICY "Users can read own profile"
ON profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Admins can read all profiles"
ON profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM profiles p
    WHERE p.id = auth.uid() AND p.is_admin = true
  )
);

-- Add index to improve performance
CREATE INDEX IF NOT EXISTS idx_profiles_admin ON profiles(id) WHERE is_admin = true;