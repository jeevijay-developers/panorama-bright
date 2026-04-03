-- ============================================
-- ADD INTERMEDIARY CODE & COMMISSION RATE FIELDS
-- ============================================

-- Add intermediary_code to profiles (e.g., ILG49754)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS intermediary_code TEXT;

-- Add commission_rate to intermediary_insurers (per-insurer commission %)
ALTER TABLE public.intermediary_insurers ADD COLUMN IF NOT EXISTS commission_rate NUMERIC(5,2) NOT NULL DEFAULT 0;
