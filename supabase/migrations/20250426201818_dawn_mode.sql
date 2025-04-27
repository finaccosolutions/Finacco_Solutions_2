/*
  # Fix profiles table RLS policies

  1. Changes
    - Drop existing RLS policies for profiles table
    - Add new comprehensive RLS policies that properly handle:
      - Profile creation during signup
      - Profile reading/updating by owners
      - Admin access to all profiles
  
  2. Security
    - Enable RLS on profiles table
    - Add policies for:
      - Profile creation during signup
      - Users reading/updating their own profiles
      - Admins accessing all profiles
*/

-- First, drop existing policies to start fresh
DROP POLICY IF EXISTS "Enable profile creation on signup" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- Re-enable RLS (in case it was disabled)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy for profile creation during signup
CREATE POLICY "Enable profile creation during signup"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = id
);

-- Policy for users to read their own profile
CREATE POLICY "Users can read own profile"
ON profiles FOR SELECT
TO authenticated
USING (
  auth.uid() = id OR
  (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  )
);

-- Policy for users to update their own profile
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy for users to delete their own profile
CREATE POLICY "Users can delete own profile"
ON profiles FOR DELETE
TO authenticated
USING (auth.uid() = id);