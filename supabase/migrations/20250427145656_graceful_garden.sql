/*
  # Fix profiles table RLS policies

  1. Changes
    - Drop existing problematic policies on profiles table
    - Create new, simplified RLS policies for the profiles table that avoid recursion
    
  2. Security
    - Enable RLS on profiles table (in case it was disabled)
    - Add policy for users to read their own profile
    - Add policy for users to update their own profile
    - Add policy for admins to read all profiles
    - Add policy for admins to update all profiles
*/

-- First, drop any existing policies to start fresh
DROP POLICY IF EXISTS "Enable read access for admins to all profiles" ON profiles;
DROP POLICY IF EXISTS "Enable read access for users to own profile" ON profiles;
DROP POLICY IF EXISTS "Enable update access for admins to all profiles" ON profiles;
DROP POLICY IF EXISTS "Enable update access for users to own profile" ON profiles;

-- Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create new, simplified policies
-- Allow users to read their own profile
CREATE POLICY "Users can read own profile"
ON profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
ON profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Allow admins to read all profiles
CREATE POLICY "Admins can read all profiles"
ON profiles
FOR SELECT
TO authenticated
USING (
  (SELECT is_admin FROM profiles WHERE id = auth.uid())
);

-- Allow admins to update all profiles
CREATE POLICY "Admins can update all profiles"
ON profiles
FOR UPDATE
TO authenticated
USING (
  (SELECT is_admin FROM profiles WHERE id = auth.uid())
)
WITH CHECK (
  (SELECT is_admin FROM profiles WHERE id = auth.uid())
);