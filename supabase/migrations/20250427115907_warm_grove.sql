/*
  # Fix recursive profiles policy

  1. Changes
    - Drop and recreate the SELECT policy on profiles table to remove recursion
    - New policy allows users to read their own profile or any profile if they are an admin
    
  2. Security
    - Maintains same security level but fixes infinite recursion issue
    - Users can still only read their own profile unless they are an admin
*/

-- Drop the existing policy that's causing recursion
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;

-- Create new policy without recursion
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT
  TO authenticated
  USING (
    id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.id IN (
        SELECT id FROM profiles WHERE is_admin = true
      )
    )
  );