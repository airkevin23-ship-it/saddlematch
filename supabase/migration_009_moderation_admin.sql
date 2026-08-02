-- Explicitly approve trusted SaddleMatch moderators.
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_profiles_is_admin
ON public.profiles (is_admin)
WHERE is_admin = TRUE;
