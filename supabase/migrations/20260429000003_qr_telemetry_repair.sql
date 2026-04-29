-- 2. Ensure scan_count and visit_count columns exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'qrs' AND column_name = 'scan_count') THEN
        ALTER TABLE public.qrs ADD COLUMN scan_count INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shops' AND column_name = 'visit_count') THEN
        ALTER TABLE public.shops ADD COLUMN visit_count INTEGER DEFAULT 0;
    END IF;
END $$;

-- 3. Enable RLS on events (if not already enabled)
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- 4. Allow anonymous inserts for telemetry (Public Scans & Visits)
DROP POLICY IF EXISTS "Anyone can log events" ON public.events;
CREATE POLICY "Anyone can log events" 
ON public.events FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);

-- 5. Allow shop owners to view events
DROP POLICY IF EXISTS "Shop owners can view their events" ON public.events;
CREATE POLICY "Shop owners can view their events" 
ON public.events FOR SELECT 
TO authenticated 
USING (
  shop_id IN (
    SELECT shop_id FROM public.shop_members WHERE user_id = auth.uid()
  )
);

-- 6. Unified Telemetry Trigger (QR Scans + Shop Visits)
CREATE OR REPLACE FUNCTION increment_telemetry_counts()
RETURNS trigger AS $$
BEGIN
  -- Handle QR Scans
  IF NEW.event_type = 'qr_scanned' AND NEW.qr_id IS NOT NULL THEN
    UPDATE public.qrs
    SET scan_count = COALESCE(scan_count, 0) + 1
    WHERE qr_id = NEW.qr_id;
  END IF;

  -- Handle Direct Shop Visits (Bio Links / Shared Links)
  IF NEW.event_type = 'shop_profile_view' AND NEW.shop_id IS NOT NULL THEN
    UPDATE public.shops
    SET visit_count = COALESCE(visit_count, 0) + 1
    WHERE shop_id = NEW.shop_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Re-apply unified trigger
DROP TRIGGER IF EXISTS trg_increment_scan_count ON public.events;
DROP TRIGGER IF EXISTS trg_increment_telemetry_counts ON public.events;
CREATE TRIGGER trg_increment_telemetry_counts
AFTER INSERT ON public.events
FOR EACH ROW EXECUTE FUNCTION increment_telemetry_counts();

-- 7. Seed/Re-sync all counts from history
-- Sync QR Scans
UPDATE public.qrs q
SET scan_count = (
  SELECT count(*) 
  FROM public.events e 
  WHERE e.qr_id = q.qr_id AND e.event_type = 'qr_scanned'
);

-- Sync Shop Visits
UPDATE public.shops s
SET visit_count = (
  SELECT count(*) 
  FROM public.events e 
  WHERE e.shop_id = s.shop_id AND e.event_type = 'shop_profile_view'
);
