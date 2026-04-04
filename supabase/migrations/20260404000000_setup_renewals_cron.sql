-- disable-transaction

-- Add new enum values for renewal_status
ALTER TYPE public.renewal_status ADD VALUE IF NOT EXISTS 'in-discussion';
ALTER TYPE public.renewal_status ADD VALUE IF NOT EXISTS 'contacted';
ALTER TYPE public.renewal_status ADD VALUE IF NOT EXISTS 'pending';
ALTER TYPE public.renewal_status ADD VALUE IF NOT EXISTS 'paid';
ALTER TYPE public.renewal_status ADD VALUE IF NOT EXISTS 'cancelled';
