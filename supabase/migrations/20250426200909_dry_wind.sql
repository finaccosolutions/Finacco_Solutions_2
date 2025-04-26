/*
  # Fix profiles RLS policies

  1. Changes
    - Drop existing INSERT policy
    - Create new INSERT policy that allows profile creation during signup
    - Ensure proper security checks are maintained
  
  2. Security
    - Maintains RLS enabled
    - Updates INSERT policy to work with auth system
    - Preserves existing SELECT and UPDATE policies
*/

-- Drop the existing INSERT policy
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Create new INSERT policy that works with auth system
CREATE POLICY "Enable insert for authenticated users only" 
ON profiles
FOR INSERT 
TO authenticated 
WITH CHECK (
  auth.uid() = id
);

-- Note: Existing SELECT and UPDATE policies are correct and maintained:
-- SELECT: Users can read own profile or admins can read all
-- UPDATE: Users can update own profile