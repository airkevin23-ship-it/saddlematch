-- Automatically quarantine profiles after three distinct reports in 24 hours.

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_visible BOOLEAN NOT NULL DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_reports_reported_created
ON public.reports (reported_id, created_at);

CREATE OR REPLACE FUNCTION public.check_report_threshold()
RETURNS TRIGGER AS $function$
DECLARE
  v_distinct_reporters INT;
BEGIN
  SELECT COUNT(DISTINCT reporter_id)
  INTO v_distinct_reporters
  FROM public.reports
  WHERE reported_id = NEW.reported_id
    AND created_at >= (NEW.created_at - INTERVAL '24 hours')
    AND created_at <= NEW.created_at;

  IF v_distinct_reporters >= 3 THEN
    UPDATE public.profiles
    SET is_visible = FALSE
    WHERE id = NEW.reported_id
      AND is_visible = TRUE;
  END IF;

  RETURN NEW;
END;
$function$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_quarantine ON public.reports;
CREATE TRIGGER trigger_auto_quarantine
AFTER INSERT ON public.reports
FOR EACH ROW
EXECUTE FUNCTION public.check_report_threshold();

-- The public profile view powers Discover and now excludes quarantined profiles.
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT
  id,
  display_name,
  date_part('year', age(current_date, birthdate))::int AS age,
  gender,
  city_id,
  bio,
  interests,
  photo_urls,
  prompts,
  is_active,
  is_demo,
  created_at,
  intro_video_url
FROM public.profiles
WHERE is_visible = TRUE;

GRANT SELECT ON public.public_profiles TO authenticated;
