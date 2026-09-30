-- ===== Audit log: every insert / update / delete on business tables =====
CREATE TABLE IF NOT EXISTS public.audit_log (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  table_name text NOT NULL,
  record_id text,
  action text NOT NULL CHECK (action IN ('INSERT','UPDATE','DELETE')),
  changed_fields text[] NOT NULL DEFAULT '{}',
  old_data jsonb,
  new_data jsonb,
  changed_by uuid,
  changed_by_name text,
  changed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_log_record_idx ON public.audit_log (table_name, record_id, changed_at DESC);
CREATE INDEX IF NOT EXISTS audit_log_changed_at_idx ON public.audit_log (changed_at DESC);
CREATE INDEX IF NOT EXISTS audit_log_changed_by_idx ON public.audit_log (changed_by);

-- Read-only for admins; rows are only ever written by the trigger below.
GRANT SELECT ON public.audit_log TO authenticated;
GRANT ALL ON public.audit_log TO service_role;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin read audit log" ON public.audit_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.audit_row_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  old_j jsonb;
  new_j jsonb;
  fields text[] := '{}';
  uid uuid := auth.uid();
  who text;
BEGIN
  IF TG_OP IN ('UPDATE','DELETE') THEN old_j := to_jsonb(OLD); END IF;
  IF TG_OP IN ('INSERT','UPDATE') THEN new_j := to_jsonb(NEW); END IF;

  IF TG_OP = 'UPDATE' THEN
    SELECT COALESCE(array_agg(k ORDER BY k), '{}') INTO fields
      FROM jsonb_object_keys(new_j) AS k
     WHERE k NOT IN ('updated_at')
       AND (old_j -> k) IS DISTINCT FROM (new_j -> k);
    -- Skip no-op updates (e.g. only updated_at touched)
    IF array_length(fields, 1) IS NULL THEN RETURN NEW; END IF;
  END IF;

  IF uid IS NOT NULL THEN
    SELECT full_name INTO who FROM public.profiles WHERE id = uid;
    IF who IS NULL OR who = '' THEN
      SELECT email INTO who FROM auth.users WHERE id = uid;
    END IF;
  END IF;

  INSERT INTO public.audit_log (table_name, record_id, action, changed_fields, old_data, new_data, changed_by, changed_by_name)
  VALUES (
    TG_TABLE_NAME,
    COALESCE(new_j ->> 'id', old_j ->> 'id'),
    TG_OP,
    fields,
    old_j,
    new_j,
    uid,
    COALESCE(who, CASE WHEN uid IS NULL THEN 'System' ELSE uid::text END)
  );

  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.audit_row_change() FROM anon, authenticated;

DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'accounts','companies','company_employees','customers','invoice_items','invoices',
    'journal_entries','journal_lines','kiosk_requests','kiosk_vendors','payment_vouchers',
    'profiles','receipts','salary_payments','services','settings','staff_salaries',
    'typing_jobs','user_roles','workflow_step_documents','workflow_steps',
    'workflow_template_steps','workflow_templates','workflows'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    IF to_regclass('public.' || t) IS NOT NULL THEN
      EXECUTE format('DROP TRIGGER IF EXISTS trg_audit ON public.%I', t);
      EXECUTE format(
        'CREATE TRIGGER trg_audit AFTER INSERT OR UPDATE OR DELETE ON public.%I
           FOR EACH ROW EXECUTE FUNCTION public.audit_row_change()', t);
    END IF;
  END LOOP;
END $$;
