/*
  # Fix profiles table RLS policies

  1. Changes
    - Drop existing INSERT policy
    - Create new INSERT policy that allows profile creation during signup
    - Ensure proper user authentication checks
  
  2. Security
    - Maintains RLS enabled
    - Updates INSERT policy to work with auth.uid()
    - Preserves existing SELECT and UPDATE policies
*/

-- Drop the existing INSERT policy
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON "public"."profiles";

-- Create new INSERT policy that works with auth system
CREATE POLICY "Enable profile creation on signup" ON "public"."profiles"
FOR INSERT 
TO authenticated
WITH CHECK (
  auth.uid() = id
);

-- Verify RLS is still enabled
ALTER TABLE "public"."profiles" FORCE ROW LEVEL SECURITY;