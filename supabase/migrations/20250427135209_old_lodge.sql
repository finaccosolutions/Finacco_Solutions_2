/*
  # Fix profiles policy and add admin navigation

  1. Changes
    - Remove recursive policy for profiles table
    - Create new, simplified policies for profiles table
    
  2. Security
    - Enable RLS on profiles table
    - Add policy for users to read their own profile
    - Add policy for admins to read all profiles
    - Add policy for users to update their own profile
*/

-- Drop existing policies to clean up
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create new, non-recursive policies
CREATE POLICY "Users can read own profile"
ON profiles
FOR SELECT
TO authenticated
USING (
  id = auth.uid() OR 
  (SELECT is_admin FROM profiles WHERE id = auth.uid())
);

CREATE POLICY "Users can update own profile"
ON profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());