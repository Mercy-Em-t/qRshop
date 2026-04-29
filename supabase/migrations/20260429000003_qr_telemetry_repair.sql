-- 20260429000003_qr_telemetry_repair.sql
-- Repairing the QR scan tracking system: RLS policies and trigger synchronization.

-- 1. Enable RLS on events (if not already enabled)
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- 2. Allow anonymous inserts for telemetry (Public QR Scans)
-- This is critical for tracking scans from customers who are not logged in.
DROP POLICY IF EXISTS "Anyone can log events" ON public.events;
CREATE POLICY "Anyone can log events" 
ON public.events FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);

-- 3. Allow shop owners to view events for their own shops
DROP POLICY IF EXISTS "Shop owners can view their events" ON public.events;
CREATE POLICY "Shop owners can view their events" 
ON public.events FOR SELECT 
TO authenticated 
USING (
  shop_id IN (
    SELECT shop_id FROM public.shop_members WHERE user_id = auth.uid()
  )
);

-- 4. Repair Trigger logic for Alphanumeric IDs
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

-- 5. Seed scan_count if any are missing (Re-synchronize)
-- This backfills the scan_count column based on existing event records.
UPDATE public.qrs q
SET scan_count = (
  SELECT count(*) 
  FROM public.events e 
  WHERE e.qr_id = q.qr_id AND e.event_type = 'qr_scanned'
);
