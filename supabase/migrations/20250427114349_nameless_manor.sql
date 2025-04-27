/*
  # Fix profiles table RLS policies

  1. Changes
    - Drop and recreate all profile policies to fix access issues
    - Ensure proper access for both regular users and admins
    
  2. Security
    - Enable RLS on profiles table
    - Add comprehensive policies for all operations
    - Fix sign out and profile access
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON profiles;
DROP POLICY IF EXISTS "Enable profile creation during signup" ON profiles;

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create new policies
CREATE POLICY "Users can read own profile"
ON profiles FOR SELECT
TO authenticated
USING (
  auth.uid() = id OR
  (SELECT is_admin FROM profiles WHERE id = auth.uid())
);

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete own profile"
ON profiles FOR DELETE
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Enable profile creation during signup"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);