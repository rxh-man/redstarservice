-- ===== numbering sequences =====
CREATE SEQUENCE IF NOT EXISTS public.journal_seq START 1;
CREATE SEQUENCE IF NOT EXISTS public.voucher_seq START 1;
CREATE SEQUENCE IF NOT EXISTS public.salary_pay_seq START 1;

-- ===== journal entries =====
CREATE TABLE public.journal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_no text NOT NULL DEFAULT '',
  entry_date date NOT NULL DEFAULT CURRENT_DATE,
  reference text,
  memo text,
  status text NOT NULL DEFAULT 'draft',
  total_debit numeric NOT NULL DEFAULT 0,
  total_credit numeric NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.journal_entries TO authenticated;
GRANT ALL ON public.journal_entries TO service_role;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "acct read journals" ON public.journal_entries FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'accountant'));
CREATE POLICY "acct insert journals" ON public.journal_entries FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'accountant'));
CREATE POLICY "acct update journals" ON public.journal_entries FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'accountant'));
CREATE POLICY "acct delete journals" ON public.journal_entries FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'accountant'));

CREATE TABLE public.journal_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id uuid NOT NULL REFERENCES public.journal_entries(id) ON DELETE CASCADE,
  account_code text NOT NULL,
  description text,
  debit numeric NOT NULL DEFAULT 0,
  credit numeric NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.journal_lines TO authenticated;
GRANT ALL ON public.journal_lines TO service_role;
ALTER TABLE public.journal_lines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "acct read journal lines" ON public.journal_lines FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'accountant'));
CREATE POLICY "acct insert journal lines" ON public.journal_lines FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'accountant'));
CREATE POLICY "acct update journal lines" ON public.journal_lines FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'accountant'));
CREATE POLICY "acct delete journal lines" ON public.journal_lines FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'accountant'));

CREATE OR REPLACE FUNCTION public.set_journal_no()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.entry_no IS NULL OR NEW.entry_no = '' THEN
    NEW.entry_no := 'RS-JV-' || to_char(now(),'YY') || '-' || nextval('public.journal_seq');
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_journal_no BEFORE INSERT ON public.journal_entries
  FOR EACH ROW EXECUTE FUNCTION public.set_journal_no();
CREATE TRIGGER trg_journals_touch BEFORE UPDATE ON public.journal_entries
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE OR REPLACE FUNCTION public.guard_journal_lines()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE st text;
BEGIN
  SELECT status INTO st FROM public.journal_entries WHERE id = COALESCE(NEW.entry_id, OLD.entry_id);
  IF st = 'posted' THEN RAISE EXCEPTION 'This journal is posted and locked for editing'; END IF;
  IF TG_OP <> 'DELETE' THEN
    IF NEW.debit < 0 OR NEW.credit < 0 THEN RAISE EXCEPTION 'Debit and credit cannot be negative'; END IF;
    IF NEW.debit > 0 AND NEW.credit > 0 THEN RAISE EXCEPTION 'A line can carry either a debit or a credit, not both'; END IF;
    IF NEW.debit = 0 AND NEW.credit = 0 THEN RAISE EXCEPTION 'Enter a debit or a credit amount'; END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END; $$;
CREATE TRIGGER trg_journal_lines_guard BEFORE INSERT OR UPDATE OR DELETE ON public.journal_lines
  FOR EACH ROW EXECUTE FUNCTION public.guard_journal_lines();

CREATE OR REPLACE FUNCTION public.recalc_journal(_entry_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF _entry_id IS NULL THEN RETURN; END IF;
  UPDATE public.journal_entries j SET
    total_debit = COALESCE((SELECT SUM(debit) FROM public.journal_lines WHERE entry_id = _entry_id),0),
    total_credit = COALESCE((SELECT SUM(credit) FROM public.journal_lines WHERE entry_id = _entry_id),0),
    updated_at = now()
  WHERE j.id = _entry_id;
END; $$;

CREATE OR REPLACE FUNCTION public.trg_recalc_journal()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.recalc_journal(COALESCE(NEW.entry_id, OLD.entry_id));
  RETURN NULL;
END; $$;
CREATE TRIGGER trg_journal_lines_recalc AFTER INSERT OR UPDATE OR DELETE ON public.journal_lines
  FOR EACH ROW EXECUTE FUNCTION public.trg_recalc_journal();

CREATE OR REPLACE FUNCTION public.guard_journal_post()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE d numeric; c numeric;
BEGIN
  IF NEW.status = 'posted' AND (OLD.status IS DISTINCT FROM 'posted') THEN
    SELECT COALESCE(SUM(debit),0), COALESCE(SUM(credit),0) INTO d, c
      FROM public.journal_lines WHERE entry_id = NEW.id;
    IF d = 0 AND c = 0 THEN RAISE EXCEPTION 'Add journal lines before posting'; END IF;
    IF ROUND(d,2) <> ROUND(c,2) THEN
      RAISE EXCEPTION 'Debits (%) and credits (%) must match before posting', ROUND(d,2), ROUND(c,2);
    END IF;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_journal_post BEFORE UPDATE ON public.journal_entries
  FOR EACH ROW EXECUTE FUNCTION public.guard_journal_post();

-- ===== payment vouchers =====
CREATE TABLE public.payment_vouchers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  voucher_no text NOT NULL DEFAULT '',
  voucher_date date NOT NULL DEFAULT CURRENT_DATE,
  payee text NOT NULL,
  payee_type text NOT NULL DEFAULT 'supplier',
  account_code text,
  amount numeric NOT NULL DEFAULT 0,
  method text NOT NULL DEFAULT 'cash',
  reference text,
  description text,
  status text NOT NULL DEFAULT 'draft',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_vouchers TO authenticated;
GRANT ALL ON public.payment_vouchers TO service_role;
ALTER TABLE public.payment_vouchers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "acct read vouchers" ON public.payment_vouchers FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'accountant'));
CREATE POLICY "acct insert vouchers" ON public.payment_vouchers FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'accountant'));
CREATE POLICY "acct update vouchers" ON public.payment_vouchers FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'accountant'));
CREATE POLICY "acct delete vouchers" ON public.payment_vouchers FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'accountant'));

CREATE OR REPLACE FUNCTION public.set_voucher_no()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.voucher_no IS NULL OR NEW.voucher_no = '' THEN
    NEW.voucher_no := 'RS-PV-' || to_char(now(),'YY') || '-' || nextval('public.voucher_seq');
  END IF;
  IF NEW.amount IS NULL OR NEW.amount <= 0 THEN
    RAISE EXCEPTION 'Voucher amount must be greater than zero';
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_voucher_no BEFORE INSERT ON public.payment_vouchers
  FOR EACH ROW EXECUTE FUNCTION public.set_voucher_no();
CREATE TRIGGER trg_vouchers_touch BEFORE UPDATE ON public.payment_vouchers
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ===== staff salaries =====
CREATE TABLE public.staff_salaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  staff_name text NOT NULL,
  designation text,
  basic_salary numeric NOT NULL DEFAULT 0,
  allowances numeric NOT NULL DEFAULT 0,
  effective_from date NOT NULL DEFAULT CURRENT_DATE,
  bank_account text,
  notes text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff_salaries TO authenticated;
GRANT ALL ON public.staff_salaries TO service_role;
ALTER TABLE public.staff_salaries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "acct read salaries" ON public.staff_salaries FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'accountant'));
CREATE POLICY "acct insert salaries" ON public.staff_salaries FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'accountant'));
CREATE POLICY "acct update salaries" ON public.staff_salaries FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'accountant'));
CREATE POLICY "acct delete salaries" ON public.staff_salaries FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'accountant'));
CREATE TRIGGER trg_salaries_touch BEFORE UPDATE ON public.staff_salaries
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.salary_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_no text NOT NULL DEFAULT '',
  salary_id uuid REFERENCES public.staff_salaries(id) ON DELETE SET NULL,
  staff_name text NOT NULL,
  period_month date NOT NULL,
  basic_salary numeric NOT NULL DEFAULT 0,
  allowances numeric NOT NULL DEFAULT 0,
  deductions numeric NOT NULL DEFAULT 0,
  net_pay numeric NOT NULL DEFAULT 0,
  method text NOT NULL DEFAULT 'bank',
  reference text,
  paid_on date,
  status text NOT NULL DEFAULT 'pending',
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.salary_payments TO authenticated;
GRANT ALL ON public.salary_payments TO service_role;
ALTER TABLE public.salary_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "acct read salary payments" ON public.salary_payments FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'accountant'));
CREATE POLICY "acct insert salary payments" ON public.salary_payments FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'accountant'));
CREATE POLICY "acct update salary payments" ON public.salary_payments FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'accountant'));
CREATE POLICY "acct delete salary payments" ON public.salary_payments FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'accountant'));

CREATE OR REPLACE FUNCTION public.set_salary_payment()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.payment_no IS NULL OR NEW.payment_no = '' THEN
    NEW.payment_no := 'RS-SAL-' || to_char(now(),'YY') || '-' || nextval('public.salary_pay_seq');
  END IF;
  IF NEW.basic_salary < 0 OR NEW.allowances < 0 OR NEW.deductions < 0 THEN
    RAISE EXCEPTION 'Salary amounts cannot be negative';
  END IF;
  NEW.net_pay := ROUND(COALESCE(NEW.basic_salary,0) + COALESCE(NEW.allowances,0) - COALESCE(NEW.deductions,0), 2);
  IF NEW.net_pay < 0 THEN RAISE EXCEPTION 'Deductions cannot exceed salary and allowances'; END IF;
  IF NEW.status = 'paid' AND NEW.paid_on IS NULL THEN NEW.paid_on := CURRENT_DATE; END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_salary_payment_set BEFORE INSERT OR UPDATE ON public.salary_payments
  FOR EACH ROW EXECUTE FUNCTION public.set_salary_payment();
CREATE TRIGGER trg_salary_payments_touch BEFORE UPDATE ON public.salary_payments
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ===== typists can raise invoices =====
DROP POLICY IF EXISTS "acct insert invoices" ON public.invoices;
CREATE POLICY "staff insert invoices" ON public.invoices FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(),'admin') OR has_role(auth.uid(),'accountant')
    OR (has_role(auth.uid(),'typist') AND created_by = auth.uid())
  );

DROP POLICY IF EXISTS "acct update invoices" ON public.invoices;
CREATE POLICY "staff update invoices" ON public.invoices FOR UPDATE TO authenticated
  USING (
    has_role(auth.uid(),'admin') OR has_role(auth.uid(),'accountant')
    OR (has_role(auth.uid(),'typist') AND created_by = auth.uid())
  );

DROP POLICY IF EXISTS "acct insert items" ON public.invoice_items;
CREATE POLICY "staff insert items" ON public.invoice_items FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(),'admin') OR has_role(auth.uid(),'accountant')
    OR EXISTS (SELECT 1 FROM public.invoices i WHERE i.id = invoice_id AND i.created_by = auth.uid())
  );

DROP POLICY IF EXISTS "acct update items" ON public.invoice_items;
CREATE POLICY "staff update items" ON public.invoice_items FOR UPDATE TO authenticated
  USING (
    has_role(auth.uid(),'admin') OR has_role(auth.uid(),'accountant')
    OR EXISTS (SELECT 1 FROM public.invoices i WHERE i.id = invoice_id AND i.created_by = auth.uid())
  );

DROP POLICY IF EXISTS "acct delete items" ON public.invoice_items;
CREATE POLICY "staff delete items" ON public.invoice_items FOR DELETE TO authenticated
  USING (
    has_role(auth.uid(),'admin') OR has_role(auth.uid(),'accountant')
    OR EXISTS (SELECT 1 FROM public.invoices i WHERE i.id = invoice_id AND i.created_by = auth.uid())
  );
