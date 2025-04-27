/*
  # Fix Profile Table and Clean Up Migrations

  1. Changes
    - Drop all existing profile-related policies
    - Create clean profile table structure
    - Add proper RLS policies
    - Add trigger for automatic profile creation
    
  2. Security
    - Enable RLS
    - Proper policies for profile access
    - Secure data handling
*/

-- Drop all existing policies first
DROP POLICY IF EXISTS "Users can read profiles" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON profiles;
DROP POLICY IF EXISTS "Enable profile creation during signup" ON profiles;
DROP POLICY IF EXISTS "Admin users can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can read profiles" ON profiles;

-- Recreate profiles table with proper structure
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  phone text,
  is_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create new policies
CREATE POLICY "allow_read_profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    id = auth.uid() OR
    (SELECT is_admin FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "allow_update_own_profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "allow_delete_own_profile"
  ON profiles FOR DELETE
  TO authenticated
  USING (auth.uid() = id);

-- Create or replace the trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    phone,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create or replace the updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updating updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();