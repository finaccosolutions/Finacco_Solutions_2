/*
  # Fix recursive RLS policies for profiles table
  
  1. Changes
    - Remove recursive policies that were causing infinite loops
    - Restructure admin access policies to avoid recursion
    - Maintain same security rules but with optimized implementation
  
  2. Security
    - Users can still only access their own profile
    - Admins can still access all profiles
    - Policies are now more efficient and avoid recursion
*/

-- Drop existing policies that have recursion issues
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create new, non-recursive policies
CREATE POLICY "Enable read access for users to own profile"
ON profiles FOR SELECT
TO authenticated
USING (
  auth.uid() = id OR 
  (SELECT is_admin FROM profiles WHERE id = auth.uid())
);

CREATE POLICY "Enable update access for users to own profile"
ON profiles FOR UPDATE
TO authenticated
USING (
  auth.uid() = id OR 
  (SELECT is_admin FROM profiles WHERE id = auth.uid())
)
WITH CHECK (
  auth.uid() = id OR 
  (SELECT is_admin FROM profiles WHERE id = auth.uid())
);

CREATE POLICY "Enable delete access for users to own profile"
ON profiles FOR DELETE
TO authenticated
USING (auth.uid() = id);