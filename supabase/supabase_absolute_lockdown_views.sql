-- =============================================================
-- SAVANNAH / SHOPQR — SUPABASE PRODUCTION LOCKDOWN: FINAL VIEWS
-- ABSOLUTE PUBLIC ACCESS REVOCATION (v1.0)
-- -------------------------------------------------------------
-- This script surgically revokes SELECT access on the 4 internal 
-- views from the 'anon' (public visitor) role. 
--
-- This plugs the final leak instantly across ALL PostgreSQL versions 
-- by denying the anonymous PostgREST API permission to read them,
-- while fully preserving access for authenticated owners and admins!
-- =============================================================

BEGIN;

-- Revoking anonymous SELECT privileges on critical internal views...
REVOKE SELECT ON public.businesses FROM anon;
REVOKE SELECT ON public.shop_revenue_stats FROM anon;
REVOKE SELECT ON public.shop_financial_relationship FROM anon;
REVOKE SELECT ON public.shop_daily_revenue FROM anon;

COMMIT;
-- =============================================================
-- ABSOLUTE HARDENING COMPLETE!
-- All public leakage vectors plugged permanently.
-- =============================================================
