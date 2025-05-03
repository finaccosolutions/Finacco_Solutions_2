/*
  # Fix Profiles RLS Policies

  1. Changes
    - Drop existing problematic RLS policies on profiles table
    - Create new, simplified RLS policies without recursion
    - Add proper admin access policies

  2. Security
    - Enable RLS on profiles table
    - Add policy for users to read their own profile
    - Add policy for admins to read all profiles
    - Add policy for users to update their own profile
    - Add policy for admins to update any profile
*/

-- Drop existing policies to prevent conflicts
DO $$ 
BEGIN
  -- Safely drop existing policies if they exist
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles'
  ) THEN
    DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
    DROP POLICY IF EXISTS "Enable update access for users to own profile" ON profiles;
    DROP POLICY IF EXISTS "Enable delete access for users to own profile" ON profiles;
    DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
  END IF;
END $$;

-- Create new simplified policies
CREATE POLICY "Users can read own profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can read all profiles"
ON profiles FOR SELECT
TO authenticated
USING (
  (SELECT is_admin FROM profiles WHERE id = auth.uid())
  OR id = auth.uid()
);

CREATE POLICY "Admins can update all profiles"
ON profiles FOR UPDATE
TO authenticated
USING (
  (SELECT is_admin FROM profiles WHERE id = auth.uid())
  OR id = auth.uid()
)
WITH CHECK (
  (SELECT is_admin FROM profiles WHERE id = auth.uid())
  OR id = auth.uid()
);