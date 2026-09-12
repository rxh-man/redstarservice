ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'vendor';

CREATE TABLE public.kiosk_vendors (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid UNIQUE,
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  business_type text,
  contact_person text,
  phone text,
  email text,
  trade_license_no text,
  license_expiry date,
  kiosk_no text,
  rent_amount numeric NOT NULL DEFAULT 0,
  rent_start_date date,
  next_payment_date date,
  payment_cycle text NOT NULL DEFAULT 'monthly',
  notes text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.kiosk_vendors TO authenticated;
GRANT ALL ON public.kiosk_vendors TO service_role;
ALTER TABLE public.kiosk_vendors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors read own kiosk record" ON public.kiosk_vendors
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "Vendors update own kiosk record" ON public.kiosk_vendors
  FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.is_staff(auth.uid()))
  WITH CHECK (user_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "Staff add kiosk vendors" ON public.kiosk_vendors
  FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Admins delete kiosk vendors" ON public.kiosk_vendors
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER touch_kiosk_vendors BEFORE UPDATE ON public.kiosk_vendors
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.kiosk_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id uuid NOT NULL REFERENCES public.kiosk_vendors(id) ON DELETE CASCADE,
  category text NOT NULL DEFAULT 'general',
  subject text NOT NULL,
  details text,
  status text NOT NULL DEFAULT 'new',
  staff_reply text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.kiosk_requests TO authenticated;
GRANT ALL ON public.kiosk_requests TO service_role;
ALTER TABLE public.kiosk_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors read own kiosk requests" ON public.kiosk_requests
  FOR SELECT TO authenticated USING (
    public.is_staff(auth.uid())
    OR EXISTS (SELECT 1 FROM public.kiosk_vendors v WHERE v.id = kiosk_requests.vendor_id AND v.user_id = auth.uid())
  );
CREATE POLICY "Vendors create own kiosk requests" ON public.kiosk_requests
  FOR INSERT TO authenticated WITH CHECK (
    public.is_staff(auth.uid())
    OR EXISTS (SELECT 1 FROM public.kiosk_vendors v WHERE v.id = kiosk_requests.vendor_id AND v.user_id = auth.uid())
  );
CREATE POLICY "Staff update kiosk requests" ON public.kiosk_requests
  FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "Admins delete kiosk requests" ON public.kiosk_requests
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER touch_kiosk_requests BEFORE UPDATE ON public.kiosk_requests
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();