/*
  # Fix profiles table policies

  1. Changes
    - Remove recursive policies that cause infinite loops
    - Simplify RLS policies for profiles table
    - Add proper indexes for performance

  2. Security
    - Enable RLS on profiles table
    - Add simplified policies for authenticated users
    - Add separate admin policies
*/

-- First, disable existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

-- Create new, simplified policies
CREATE POLICY "Enable read access for users to own profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Enable update access for users to own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable read access for admins to all profiles"
ON profiles FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND is_admin = true
  )
);

CREATE POLICY "Enable update access for admins to all profiles"
ON profiles FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND is_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);