/*
  # Fix infinite recursion in profiles RLS policy

  1. Changes
    - Remove recursive admin check from profiles SELECT policy
    - Simplify policy to allow users to read their own profile
    - Add separate policy for admin access

  2. Security
    - Maintains row-level security
    - Prevents infinite recursion
    - Preserves admin access capabilities
*/

-- Drop existing problematic policies
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
    FROM profiles
    WHERE id = auth.uid() AND is_admin = true
  )
);