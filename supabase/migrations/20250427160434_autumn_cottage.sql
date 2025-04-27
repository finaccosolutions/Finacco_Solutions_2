/*
  # Fix profiles table RLS policies

  1. Changes
    - Remove existing RLS policies that may cause recursion
    - Add new, simplified RLS policies for the profiles table:
      - Users can read their own profile
      - Users can update their own profile
      - Users can delete their own profile
      - Admins can read all profiles
      - Admins can update all profiles
  
  2. Security
    - Maintains row-level security
    - Simplifies policy conditions to prevent recursion
    - Uses direct comparison with auth.uid() instead of subqueries
*/

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

-- Create new, simplified policies
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

-- Admin policies using a direct is_admin check
CREATE POLICY "Admins can read all profiles"
ON profiles FOR SELECT
TO authenticated
USING (
  (auth.uid() = id) OR 
  (EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND is_admin = true
  ))
);

CREATE POLICY "Admins can update all profiles"
ON profiles FOR UPDATE
TO authenticated
USING (
  (auth.uid() = id) OR 
  (EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND is_admin = true
  ))
)
WITH CHECK (
  (auth.uid() = id) OR 
  (EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND is_admin = true
  ))
);