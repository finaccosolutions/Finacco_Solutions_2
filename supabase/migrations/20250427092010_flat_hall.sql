-- Drop the existing problematic policy
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;

-- Create new policy without recursion
CREATE POLICY "Users can read own profile" 
ON profiles 
FOR SELECT 
TO authenticated 
USING (
  -- Allow users to read their own profile
  auth.uid() = id 
  OR 
  -- Allow admins to read all profiles
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND is_admin = true
  )
);