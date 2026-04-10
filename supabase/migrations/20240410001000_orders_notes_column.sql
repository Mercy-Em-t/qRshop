-- Migration: Add notes column to orders table
-- This enables shop operators to attach internal notes to orders
-- Notes are displayed in the Order Manager and exported to CSV

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT NULL;

COMMENT ON COLUMN orders.notes IS 'Internal operator note for this order (e.g. special instructions, delivery info)';
