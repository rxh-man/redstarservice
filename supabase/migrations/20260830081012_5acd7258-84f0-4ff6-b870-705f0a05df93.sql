CREATE OR REPLACE FUNCTION public.guard_invoice_items()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE st text;
BEGIN
  SELECT status INTO st FROM public.invoices WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);
  IF st IN ('paid','cancelled') THEN
    RAISE EXCEPTION 'Invoice is % and locked for editing', st;
  END IF;
  IF TG_OP <> 'DELETE' THEN
    IF NEW.qty IS NULL OR NEW.qty <= 0 THEN RAISE EXCEPTION 'Quantity must be greater than zero'; END IF;
    IF NEW.unit_price < 0 OR NEW.govt_fee < 0 THEN RAISE EXCEPTION 'Fees cannot be negative'; END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END; $$;

DROP TRIGGER IF EXISTS trg_items_guard ON public.invoice_items;
CREATE TRIGGER trg_items_guard
BEFORE INSERT OR UPDATE OR DELETE ON public.invoice_items
FOR EACH ROW EXECUTE FUNCTION public.guard_invoice_items();

CREATE OR REPLACE FUNCTION public.guard_receipts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE st text; tot numeric; paid numeric;
BEGIN
  IF NEW.amount IS NULL OR NEW.amount <= 0 THEN
    RAISE EXCEPTION 'Receipt amount must be greater than zero';
  END IF;
  IF NEW.invoice_id IS NOT NULL THEN
    SELECT status, total INTO st, tot FROM public.invoices WHERE id = NEW.invoice_id;
    IF st = 'cancelled' THEN RAISE EXCEPTION 'Cannot collect payment on a cancelled invoice'; END IF;
    SELECT COALESCE(SUM(amount),0) INTO paid FROM public.receipts
      WHERE invoice_id = NEW.invoice_id AND (TG_OP = 'INSERT' OR id <> NEW.id);
    IF paid + NEW.amount > COALESCE(tot,0) + 0.01 THEN
      RAISE EXCEPTION 'Payment exceeds the outstanding balance of %', ROUND(COALESCE(tot,0) - paid, 2);
    END IF;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_receipts_guard ON public.receipts;
CREATE TRIGGER trg_receipts_guard
BEFORE INSERT OR UPDATE ON public.receipts
FOR EACH ROW EXECUTE FUNCTION public.guard_receipts();