/*
  # Fix Profile Table Permissions

  1. Changes
    - Enable Row Level Security (RLS) on profiles table
    - Add policies for authenticated users to:
      - Select their own profile
      - Insert their own profile
      - Update their own profile
      - Delete their own profile
    
  2. Security
    - Ensures users can only access their own profile data
    - Maintains data isolation between users
    - Prevents unauthorized access to profile information
*/

-- Enable RLS on profiles table if not already enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to ensure clean state
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Enable profile creation during signup" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON profiles;

-- Create comprehensive set of policies
CREATE POLICY "Users can read own profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Enable profile creation during signup"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete own profile"
ON profiles FOR DELETE
TO authenticated
USING (auth.uid() = id);