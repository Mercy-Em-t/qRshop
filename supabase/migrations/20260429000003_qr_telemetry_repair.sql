-- 2. Ensure scan_count column exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'qrs' AND column_name = 'scan_count') THEN
        ALTER TABLE public.qrs ADD COLUMN scan_count INTEGER DEFAULT 0;
    END IF;
END $$;

-- 3. Enable RLS on events (if not already enabled)
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- 4. Allow anonymous inserts for telemetry (Public QR Scans)
-- This is critical for tracking scans from customers who are not logged in.
DROP POLICY IF EXISTS "Anyone can log events" ON public.events;
CREATE POLICY "Anyone can log events" 
ON public.events FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);

-- 5. Allow shop owners to view events for their own shops
DROP POLICY IF EXISTS "Shop owners can view their events" ON public.events;
CREATE POLICY "Shop owners can view their events" 
ON public.events FOR SELECT 
TO authenticated 
USING (
  shop_id IN (
    SELECT shop_id FROM public.shop_members WHERE user_id = auth.uid()
  )
);

-- 6. Repair Trigger logic for Alphanumeric IDs
-- Ensure the increment trigger handles TEXT qr_ids correctly.
CREATE OR REPLACE FUNCTION increment_scan_count()
RETURNS trigger AS $$
BEGIN
  IF NEW.event_type = 'qr_scanned' AND NEW.qr_id IS NOT NULL THEN
    UPDATE public.qrs
    SET scan_count = COALESCE(scan_count, 0) + 1
    WHERE qr_id = NEW.qr_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Re-apply trigger to ensure it's active
DROP TRIGGER IF EXISTS trg_increment_scan_count ON public.events;
CREATE TRIGGER trg_increment_scan_count
AFTER INSERT ON public.events
FOR EACH ROW EXECUTE FUNCTION increment_scan_count();

-- 7. Seed scan_count if any are missing (Re-synchronize)
-- This backfills the scan_count column based on existing event records.
UPDATE public.qrs q
SET scan_count = (
  SELECT count(*) 
  FROM public.events e 
  WHERE e.qr_id = q.qr_id AND e.event_type = 'qr_scanned'
);
