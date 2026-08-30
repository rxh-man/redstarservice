DROP INDEX IF EXISTS public.services_code_key;
CREATE UNIQUE INDEX services_code_key ON public.services (code);