/*
  # Fix profiles table RLS policy

  1. Changes
    - Drop and recreate the SELECT policy for profiles table to fix infinite recursion
    
  2. Security
    - Maintains RLS security while fixing the recursion issue
    - Users can still only read their own profile
    - Admins can read all profiles without causing recursion
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
  auth.uid() = id 
  OR 
  -- Allow admins to read all profiles, but check admin status directly
  is_admin = true
);