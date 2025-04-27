/*
  # Fix profiles table RLS policies

  1. Changes
    - Update RLS policies for profiles table to allow new user registration
    - Add policy for inserting new profiles during signup

  2. Security
    - Enable RLS on profiles table
    - Add policy for authenticated users to insert their own profile
    - Maintain existing policies for read/update/delete
*/

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON profiles;
DROP POLICY IF EXISTS "Enable profile creation during signup" ON profiles;

-- Recreate policies with proper permissions
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING ((auth.uid() = id) OR (EXISTS (
    SELECT 1
    FROM profiles p
    WHERE p.id = auth.uid() AND p.is_admin = true
  )));

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete own profile"
  ON profiles
  FOR DELETE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Enable profile creation during signup"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);