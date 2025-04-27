/*
  # Fix recursive profiles policy

  1. Changes
    - Drop the recursive SELECT policy on profiles table
    - Create new non-recursive SELECT policy that:
      - Allows users to read their own profile
      - Allows admin users to read all profiles
      - Uses a simpler condition that avoids recursion
  
  2. Security
    - Maintains same access control intent
    - Eliminates infinite recursion issue
    - Preserves RLS protection
*/

-- Drop the existing recursive policy
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;

-- Create new non-recursive policy
CREATE POLICY "Users can read profiles" ON profiles
  FOR SELECT
  TO authenticated
  USING (
    -- User can read their own profile
    id = auth.uid() 
    OR 
    -- Admin users can read all profiles
    (
      SELECT is_admin 
      FROM auth.users 
      WHERE auth.users.id = auth.uid()
    )
  );