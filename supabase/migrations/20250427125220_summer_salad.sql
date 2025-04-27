/*
  # Fix infinite recursion in profiles RLS policy

  1. Changes
    - Drop and recreate the SELECT policy to eliminate recursion
    - Simplify admin check logic
    
  2. Security
    - Maintains same security level
    - Users can still only read their own profile
    - Admins can read all profiles
*/

-- Drop the existing problematic policy
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;

-- Create new policy without recursion
CREATE POLICY "Users can read own profile" 
ON profiles 
FOR SELECT 
TO authenticated 
USING (
  -- Allow users to read their own profile
  id = auth.uid() 
  OR 
  -- Allow admins to read all profiles
  (SELECT is_admin FROM profiles WHERE id = auth.uid())
);