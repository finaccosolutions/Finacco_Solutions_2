/*
  # Fix profiles table RLS policies

  1. Changes
    - Drop existing INSERT policy
    - Create new INSERT policy with correct conditions
    - Ensure policy allows new user profile creation during signup

  2. Security
    - Maintain security by ensuring users can only create their own profile
    - Keep existing SELECT, UPDATE, and DELETE policies unchanged
*/

-- Drop the existing INSERT policy
DROP POLICY IF EXISTS "Enable profile creation on signup" ON profiles;

-- Create new INSERT policy with correct conditions
CREATE POLICY "Enable profile creation on signup"
ON profiles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = id AND
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = profiles.id
  )
);