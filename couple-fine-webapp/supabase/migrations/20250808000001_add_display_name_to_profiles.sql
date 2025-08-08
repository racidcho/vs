-- Add display_name support to profiles table if not exists
-- This migration ensures display_name column exists and is properly indexed

-- Check if display_name column exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'display_name'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.profiles 
        ADD COLUMN display_name TEXT NOT NULL DEFAULT '';
    END IF;
END $$;

-- Update any profiles that might have empty display_names to use email prefix
UPDATE public.profiles 
SET display_name = COALESCE(NULLIF(display_name, ''), split_part(email, '@', 1), 'User')
WHERE display_name = '' OR display_name IS NULL;

-- Add index for display_name searches (if not exists)
CREATE INDEX IF NOT EXISTS idx_profiles_display_name ON public.profiles(display_name);

-- Add check constraint to ensure display_name is not empty
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints tc 
        WHERE tc.table_name = 'profiles' 
        AND tc.constraint_name = 'profiles_display_name_not_empty'
        AND tc.table_schema = 'public'
    ) THEN
        ALTER TABLE public.profiles 
        ADD CONSTRAINT profiles_display_name_not_empty 
        CHECK (length(trim(display_name)) > 0);
    END IF;
END $$;

-- Update RLS policy to ensure display_name visibility for couple partners
-- This allows partners to see each other's display names
DROP POLICY IF EXISTS "Partners can see each other display names" ON public.profiles;
CREATE POLICY "Partners can see each other display names" ON public.profiles
  FOR SELECT USING (
    auth.uid() = id OR 
    auth.uid() IN (
      SELECT CASE 
        WHEN partner_1_id = profiles.id THEN partner_2_id
        WHEN partner_2_id = profiles.id THEN partner_1_id
      END
      FROM public.couples 
      WHERE (partner_1_id = profiles.id OR partner_2_id = profiles.id)
      AND is_active = true
    )
  );

-- Comment on the display_name column
COMMENT ON COLUMN public.profiles.display_name IS '사용자의 표시 이름 - 커플 앱에서 서로를 부를 이름';

-- Insert activity log when display_name is updated
CREATE OR REPLACE FUNCTION log_display_name_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if display_name actually changed and user has a couple
  IF OLD.display_name IS DISTINCT FROM NEW.display_name AND NEW.couple_id IS NOT NULL THEN
    INSERT INTO public.activity_logs (couple_id, user_id, activity_type, activity_data)
    VALUES (
      NEW.couple_id, 
      NEW.id, 
      'display_name_updated',
      jsonb_build_object(
        'old_name', OLD.display_name,
        'new_name', NEW.display_name,
        'user_id', NEW.id
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for display_name changes (drop if exists first)
DROP TRIGGER IF EXISTS log_display_name_change_trigger ON public.profiles;
CREATE TRIGGER log_display_name_change_trigger
  AFTER UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION log_display_name_change();