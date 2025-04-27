/*
  # Fix profiles table RLS policies

  1. Changes
    - Drop existing RLS policies on profiles table
    - Create new RLS policies for profiles table that properly handle:
      - INSERT: Allow authenticated users to create their own profile
      - SELECT: Allow authenticated users to read their own profile
      - UPDATE: Allow authenticated users to update their own profile
      - DELETE: Allow authenticated users to delete their own profile
    
  2. Security
    - Enable RLS on profiles table
    - Add comprehensive RLS policies for all operations
    - Ensure users can only access their own data
*/

-- First, drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Enable profile creation on signup" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create new policies
CREATE POLICY "Enable profile creation on signup"
ON profiles FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can read own profile"
ON profiles FOR SELECT 
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE 
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete own profile"
ON profiles FOR DELETE 
TO authenticated
USING (auth.uid() = id);

-- Add policy for admins to view all profiles
CREATE POLICY "Admins can view all profiles"
ON profiles FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND is_admin = true
  )
);