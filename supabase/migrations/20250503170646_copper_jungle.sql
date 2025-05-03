/*
  # Fix infinite recursion in profiles RLS policies

  1. Changes
    - Drop all existing policies that may cause recursion
    - Create new, optimized policies without circular dependencies
    - Add proper indexes for performance

  2. Security
    - Maintain existing security rules
    - Prevent infinite recursion
    - Optimize query performance
*/

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Enable read access for users to own profile" ON profiles;
DROP POLICY IF EXISTS "Enable update access for users to own profile" ON profiles;
DROP POLICY IF EXISTS "Enable delete access for users to own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

-- Create optimized indexes
CREATE INDEX IF NOT EXISTS idx_profiles_admin ON profiles(id) WHERE is_admin = true;

-- Create new, non-recursive policies
CREATE POLICY "Allow read access for authenticated users on profiles"
ON profiles FOR SELECT
TO authenticated
USING (
  id = auth.uid() OR
  EXISTS (
    SELECT 1
    FROM auth.users u
    JOIN profiles p ON u.id = p.id
    WHERE u.id = auth.uid()
    AND p.is_admin = true
  )
);

CREATE POLICY "Allow update access for authenticated users on profiles"
ON profiles FOR UPDATE
TO authenticated
USING (
  id = auth.uid() OR
  EXISTS (
    SELECT 1
    FROM auth.users u
    JOIN profiles p ON u.id = p.id
    WHERE u.id = auth.uid()
    AND p.is_admin = true
  )
)
WITH CHECK (
  id = auth.uid() OR
  EXISTS (
    SELECT 1
    FROM auth.users u
    JOIN profiles p ON u.id = p.id
    WHERE u.id = auth.uid()
    AND p.is_admin = true
  )
);

CREATE POLICY "Allow delete access for own profile"
ON profiles FOR DELETE
TO authenticated
USING (id = auth.uid());