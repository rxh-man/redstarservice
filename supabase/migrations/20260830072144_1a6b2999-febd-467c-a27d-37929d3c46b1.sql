
-- ROLES -------------------------------------------------------------
CREATE TYPE public.app_role AS ENUM ('admin','accountant','typist');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  email text,
  phone text,
  job_title text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id);
$$;

CREATE OR REPLACE FUNCTION public.my_roles()
RETURNS SETOF public.app_role LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.user_roles WHERE user_id = auth.uid();
$$;

CREATE POLICY "staff read profiles" ON public.profiles FOR SELECT TO authenticated USING (public.is_staff(auth.uid()) OR id = auth.uid());
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin delete profiles" ON public.profiles FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE POLICY "staff read roles" ON public.user_roles FOR SELECT TO authenticated USING (public.is_staff(auth.uid()) OR user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_profiles_touch BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name',''), NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;

-- CUSTOMERS ---------------------------------------------------------
CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  name_ar text,
  company text,
  trn text,
  email text,
  phone text,
  emirates_id text,
  address text,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT ALL ON public.customers TO service_role;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read customers" ON public.customers FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "staff write customers" ON public.customers FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "staff update customers" ON public.customers FOR UPDATE TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "admin delete customers" ON public.customers FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_customers_touch BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- SERVICES ----------------------------------------------------------
CREATE TABLE public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  name_ar text,
  category text,
  service_fee numeric(12,2) NOT NULL DEFAULT 0,
  govt_fee numeric(12,2) NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.services TO authenticated;
GRANT ALL ON public.services TO service_role;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read services" ON public.services FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "admin insert services" ON public.services FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin update services" ON public.services FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin delete services" ON public.services FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_services_touch BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- CHART OF ACCOUNTS -------------------------------------------------
CREATE TABLE public.accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('asset','liability','equity','income','expense')),
  parent_code text,
  opening_balance numeric(14,2) NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.accounts TO authenticated;
GRANT ALL ON public.accounts TO service_role;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read accounts" ON public.accounts FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "acct insert accounts" ON public.accounts FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'accountant'));
CREATE POLICY "acct update accounts" ON public.accounts FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'accountant'));
CREATE POLICY "admin delete accounts" ON public.accounts FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_accounts_touch BEFORE UPDATE ON public.accounts FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- INVOICES ----------------------------------------------------------
CREATE SEQUENCE public.invoice_seq START 1001;
CREATE SEQUENCE public.receipt_seq START 5001;

CREATE TABLE public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_no text NOT NULL UNIQUE,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  issue_date date NOT NULL DEFAULT current_date,
  due_date date,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','partial','paid','cancelled')),
  subtotal numeric(14,2) NOT NULL DEFAULT 0,
  vat_rate numeric(5,2) NOT NULL DEFAULT 5,
  vat_amount numeric(14,2) NOT NULL DEFAULT 0,
  govt_fees numeric(14,2) NOT NULL DEFAULT 0,
  total numeric(14,2) NOT NULL DEFAULT 0,
  paid_amount numeric(14,2) NOT NULL DEFAULT 0,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoices TO authenticated;
GRANT ALL ON public.invoices TO service_role;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read invoices" ON public.invoices FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "acct insert invoices" ON public.invoices FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'accountant'));
CREATE POLICY "acct update invoices" ON public.invoices FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'accountant'));
CREATE POLICY "admin delete invoices" ON public.invoices FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_invoices_touch BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  service_id uuid REFERENCES public.services(id) ON DELETE SET NULL,
  description text NOT NULL,
  description_ar text,
  qty numeric(10,2) NOT NULL DEFAULT 1,
  unit_price numeric(12,2) NOT NULL DEFAULT 0,
  govt_fee numeric(12,2) NOT NULL DEFAULT 0,
  taxable boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoice_items TO authenticated;
GRANT ALL ON public.invoice_items TO service_role;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read items" ON public.invoice_items FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "acct insert items" ON public.invoice_items FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'accountant'));
CREATE POLICY "acct update items" ON public.invoice_items FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'accountant'));
CREATE POLICY "acct delete items" ON public.invoice_items FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'accountant'));

-- RECEIPTS ----------------------------------------------------------
CREATE TABLE public.receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_no text NOT NULL UNIQUE,
  invoice_id uuid REFERENCES public.invoices(id) ON DELETE SET NULL,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  amount numeric(14,2) NOT NULL DEFAULT 0,
  method text NOT NULL DEFAULT 'cash' CHECK (method IN ('cash','card','bank_transfer','cheque','online')),
  reference text,
  received_on date NOT NULL DEFAULT current_date,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.receipts TO authenticated;
GRANT ALL ON public.receipts TO service_role;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read receipts" ON public.receipts FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "acct insert receipts" ON public.receipts FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'accountant'));
CREATE POLICY "acct update receipts" ON public.receipts FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'accountant'));
CREATE POLICY "admin delete receipts" ON public.receipts FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- TYPING JOBS -------------------------------------------------------
CREATE TABLE public.typing_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_no text,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  service_id uuid REFERENCES public.services(id) ON DELETE SET NULL,
  title text NOT NULL,
  details text,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','in_progress','ready','submitted','completed','rejected')),
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
  assigned_to uuid,
  due_date date,
  invoice_id uuid REFERENCES public.invoices(id) ON DELETE SET NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.typing_jobs TO authenticated;
GRANT ALL ON public.typing_jobs TO service_role;
ALTER TABLE public.typing_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read jobs" ON public.typing_jobs FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "staff insert jobs" ON public.typing_jobs FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "staff update jobs" ON public.typing_jobs FOR UPDATE TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "admin delete jobs" ON public.typing_jobs FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_jobs_touch BEFORE UPDATE ON public.typing_jobs FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- SETTINGS ----------------------------------------------------------
CREATE TABLE public.settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  company_name text NOT NULL DEFAULT 'Red Star Services',
  company_name_ar text,
  address text,
  phone text,
  email text,
  trn text,
  vat_rate numeric(5,2) NOT NULL DEFAULT 5,
  invoice_prefix text NOT NULL DEFAULT 'RS-INV-',
  receipt_prefix text NOT NULL DEFAULT 'RS-RCT-',
  footer_note text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.settings TO authenticated;
GRANT ALL ON public.settings TO service_role;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read settings" ON public.settings FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "admin insert settings" ON public.settings FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin update settings" ON public.settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- NUMBERING + TOTALS ------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_invoice_no()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE p text;
BEGIN
  IF NEW.invoice_no IS NULL OR NEW.invoice_no = '' THEN
    SELECT COALESCE(invoice_prefix,'RS-INV-') INTO p FROM public.settings WHERE id;
    NEW.invoice_no := COALESCE(p,'RS-INV-') || to_char(now(),'YY') || '-' || nextval('public.invoice_seq');
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_invoice_no BEFORE INSERT ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.set_invoice_no();

CREATE OR REPLACE FUNCTION public.set_receipt_no()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE p text;
BEGIN
  IF NEW.receipt_no IS NULL OR NEW.receipt_no = '' THEN
    SELECT COALESCE(receipt_prefix,'RS-RCT-') INTO p FROM public.settings WHERE id;
    NEW.receipt_no := COALESCE(p,'RS-RCT-') || to_char(now(),'YY') || '-' || nextval('public.receipt_seq');
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_receipt_no BEFORE INSERT ON public.receipts FOR EACH ROW EXECUTE FUNCTION public.set_receipt_no();

CREATE OR REPLACE FUNCTION public.recalc_invoice(_invoice_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s numeric := 0; g numeric := 0; tx numeric := 0; r numeric := 5; paid numeric := 0; st text;
BEGIN
  IF _invoice_id IS NULL THEN RETURN; END IF;
  SELECT COALESCE(SUM(qty*unit_price),0), COALESCE(SUM(govt_fee),0),
         COALESCE(SUM(CASE WHEN taxable THEN qty*unit_price ELSE 0 END),0)
    INTO s, g, tx FROM public.invoice_items WHERE invoice_id = _invoice_id;
  SELECT vat_rate, status INTO r, st FROM public.invoices WHERE id = _invoice_id;
  SELECT COALESCE(SUM(amount),0) INTO paid FROM public.receipts WHERE invoice_id = _invoice_id;
  UPDATE public.invoices SET
    subtotal = s, govt_fees = g,
    vat_amount = ROUND(tx * COALESCE(r,5) / 100.0, 2),
    total = ROUND(s + g + tx * COALESCE(r,5) / 100.0, 2),
    paid_amount = paid,
    status = CASE
      WHEN st = 'cancelled' THEN 'cancelled'
      WHEN paid <= 0 THEN CASE WHEN st = 'sent' THEN 'sent' ELSE 'draft' END
      WHEN paid >= ROUND(s + g + tx * COALESCE(r,5) / 100.0, 2) THEN 'paid'
      ELSE 'partial' END,
    updated_at = now()
  WHERE id = _invoice_id;
END; $$;

CREATE OR REPLACE FUNCTION public.trg_recalc_items()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.recalc_invoice(COALESCE(NEW.invoice_id, OLD.invoice_id));
  RETURN NULL;
END; $$;
CREATE TRIGGER trg_items_recalc AFTER INSERT OR UPDATE OR DELETE ON public.invoice_items FOR EACH ROW EXECUTE FUNCTION public.trg_recalc_items();
CREATE TRIGGER trg_receipts_recalc AFTER INSERT OR UPDATE OR DELETE ON public.receipts FOR EACH ROW EXECUTE FUNCTION public.trg_recalc_items();

-- SEED --------------------------------------------------------------
INSERT INTO public.settings (id, company_name, company_name_ar, address, phone, email, trn, vat_rate, footer_note)
VALUES (true,'Red Star Services','ريد ستار للخدمات','Al Sajaa Industrial Area, Sharjah, UAE','+971 6 000 0000','info@redstar.ae','100000000000003',5,'Thank you for your business. All government fees are charged at actual.');

INSERT INTO public.accounts (code,name,type,parent_code,opening_balance) VALUES
('1000','Assets','asset',NULL,0),
('1100','Cash on Hand','asset','1000',25000),
('1200','Bank - Current Account','asset','1000',150000),
('1300','Accounts Receivable','asset','1000',0),
('2000','Liabilities','liability',NULL,0),
('2100','Accounts Payable','liability','2000',0),
('2200','VAT Payable','liability','2000',0),
('3000','Equity','equity',NULL,0),
('3100','Owner Capital','equity','3000',100000),
('3200','Retained Earnings','equity','3000',0),
('4000','Income','income',NULL,0),
('4100','Service Revenue - Typing','income','4000',0),
('4200','Service Revenue - PRO','income','4000',0),
('4300','Government Fee Recovery','income','4000',0),
('5000','Expenses','expense',NULL,0),
('5100','Government Fees Paid','expense','5000',0),
('5200','Salaries & Wages','expense','5000',0),
('5300','Rent','expense','5000',0),
('5400','Utilities','expense','5000',0),
('5500','Office & Admin','expense','5000',0);

INSERT INTO public.services (name,name_ar,category,service_fee,govt_fee) VALUES
('New Employment Visa (Inside Country)','تأشيرة عمل جديدة','Immigration',500,3200),
('Visa Renewal','تجديد التأشيرة','Immigration',400,2800),
('Emirates ID Application','طلب الهوية الإماراتية','Immigration',150,370),
('Labour Contract Typing (MOHRE)','طباعة عقد العمل','Labour',200,300),
('Tawjeeh Session Booking','حجز جلسة توجيه','Labour',100,120),
('Trade Licence New Issuance','إصدار رخصة تجارية جديدة','Licensing',1500,6500),
('Trade Licence Renewal','تجديد رخصة تجارية','Licensing',800,4500),
('Legal Translation (per page)','ترجمة قانونية','Translation',80,0),
('Document Attestation (MOFA)','تصديق المستندات','Attestation',150,150),
('Ejari Registration','تسجيل إيجاري','Real Estate',250,220),
('Family Visa Application','تأشيرة عائلية','Immigration',450,2500),
('Medical Fitness Typing','طباعة الفحص الطبي','Health',100,320);
