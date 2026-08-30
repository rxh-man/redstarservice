ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS code text,
  ADD COLUMN IF NOT EXISTS govt_bank text;

CREATE UNIQUE INDEX IF NOT EXISTS services_code_key ON public.services (code) WHERE code IS NOT NULL;
CREATE INDEX IF NOT EXISTS services_category_idx ON public.services (category);
CREATE INDEX IF NOT EXISTS services_name_idx ON public.services (lower(name));