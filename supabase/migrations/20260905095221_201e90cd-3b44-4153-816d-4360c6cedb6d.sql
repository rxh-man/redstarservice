-- companies
CREATE TABLE public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  name_ar text,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  trade_license_no text,
  license_expiry date,
  establishment_card_no text,
  establishment_card_expiry date,
  trn text,
  phone text,
  email text,
  address text,
  notes text,
  assigned_typist uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.companies TO authenticated;
GRANT ALL ON public.companies TO service_role;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read companies" ON public.companies FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'accountant')
    OR (is_staff(auth.uid()) AND (assigned_typist = auth.uid() OR assigned_typist IS NULL)));
CREATE POLICY "acct insert companies" ON public.companies FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'accountant'));
CREATE POLICY "acct update companies" ON public.companies FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'accountant'));
CREATE POLICY "admin delete companies" ON public.companies FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_companies_touch BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE INDEX idx_companies_typist ON public.companies(assigned_typist);

-- helper: can the current user see a company
CREATE OR REPLACE FUNCTION public.can_access_company(_company_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.companies c
    WHERE c.id = _company_id
      AND (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'accountant')
        OR (is_staff(auth.uid()) AND (c.assigned_typist = auth.uid() OR c.assigned_typist IS NULL)))
  );
$$;
REVOKE ALL ON FUNCTION public.can_access_company(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.can_access_company(uuid) TO authenticated, service_role;

-- employees
CREATE TABLE public.company_employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  name_ar text,
  nationality text,
  designation text,
  phone text,
  email text,
  passport_no text,
  passport_expiry date,
  visa_no text,
  visa_expiry date,
  emirates_id_no text,
  emirates_id_expiry date,
  labour_card_no text,
  labour_card_expiry date,
  status text NOT NULL DEFAULT 'active',
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_employees TO authenticated;
GRANT ALL ON public.company_employees TO service_role;
ALTER TABLE public.company_employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read employees" ON public.company_employees FOR SELECT TO authenticated
  USING (public.can_access_company(company_id));
CREATE POLICY "staff insert employees" ON public.company_employees FOR INSERT TO authenticated
  WITH CHECK (public.can_access_company(company_id));
CREATE POLICY "staff update employees" ON public.company_employees FOR UPDATE TO authenticated
  USING (public.can_access_company(company_id));
CREATE POLICY "admin delete employees" ON public.company_employees FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_employees_touch BEFORE UPDATE ON public.company_employees
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE INDEX idx_employees_company ON public.company_employees(company_id);

-- workflow templates
CREATE TABLE public.workflow_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  name_ar text,
  description text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.workflow_templates TO authenticated;
GRANT ALL ON public.workflow_templates TO service_role;
ALTER TABLE public.workflow_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read templates" ON public.workflow_templates FOR SELECT TO authenticated
  USING (is_staff(auth.uid()));

CREATE TABLE public.workflow_template_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES public.workflow_templates(id) ON DELETE CASCADE,
  sequence_no integer NOT NULL,
  name text NOT NULL,
  name_ar text,
  description text,
  requirement text NOT NULL DEFAULT 'required',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (template_id, sequence_no)
);
GRANT SELECT ON public.workflow_template_steps TO authenticated;
GRANT ALL ON public.workflow_template_steps TO service_role;
ALTER TABLE public.workflow_template_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read template steps" ON public.workflow_template_steps FOR SELECT TO authenticated
  USING (is_staff(auth.uid()));

-- workflows
CREATE SEQUENCE public.workflow_seq START 1;
CREATE TABLE public.workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_no text NOT NULL,
  template_id uuid REFERENCES public.workflow_templates(id) ON DELETE SET NULL,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id uuid REFERENCES public.company_employees(id) ON DELETE SET NULL,
  title text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  assigned_typist uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  invoice_id uuid REFERENCES public.invoices(id) ON DELETE SET NULL,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workflows TO authenticated;
GRANT ALL ON public.workflows TO service_role;
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read workflows" ON public.workflows FOR SELECT TO authenticated
  USING (public.can_access_company(company_id));
CREATE POLICY "staff insert workflows" ON public.workflows FOR INSERT TO authenticated
  WITH CHECK (public.can_access_company(company_id));
CREATE POLICY "staff update workflows" ON public.workflows FOR UPDATE TO authenticated
  USING (public.can_access_company(company_id));
CREATE POLICY "admin delete workflows" ON public.workflows FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_workflows_touch BEFORE UPDATE ON public.workflows
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE INDEX idx_workflows_company ON public.workflows(company_id);

CREATE OR REPLACE FUNCTION public.set_workflow_no()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.workflow_no IS NULL OR NEW.workflow_no = '' THEN
    NEW.workflow_no := 'RS-WF-' || to_char(now(),'YY') || '-' || nextval('public.workflow_seq');
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_workflow_no BEFORE INSERT ON public.workflows
  FOR EACH ROW EXECUTE FUNCTION public.set_workflow_no();

-- workflow steps
CREATE TABLE public.workflow_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
  sequence_no integer NOT NULL,
  name text NOT NULL,
  name_ar text,
  description text,
  requirement text NOT NULL DEFAULT 'required',
  status text NOT NULL DEFAULT 'locked',
  assigned_typist uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  notes text,
  completed_at timestamptz,
  completed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workflow_id, sequence_no)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workflow_steps TO authenticated;
GRANT ALL ON public.workflow_steps TO service_role;
ALTER TABLE public.workflow_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read steps" ON public.workflow_steps FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.workflows w WHERE w.id = workflow_id AND public.can_access_company(w.company_id)));
CREATE POLICY "staff insert steps" ON public.workflow_steps FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.workflows w WHERE w.id = workflow_id AND public.can_access_company(w.company_id)));
CREATE POLICY "staff update steps" ON public.workflow_steps FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.workflows w WHERE w.id = workflow_id AND public.can_access_company(w.company_id)));
CREATE POLICY "admin delete steps" ON public.workflow_steps FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_steps_touch BEFORE UPDATE ON public.workflow_steps
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE INDEX idx_steps_workflow ON public.workflow_steps(workflow_id);

-- guard: a locked step cannot be started before earlier required steps are completed
CREATE OR REPLACE FUNCTION public.guard_workflow_steps()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE pending integer;
BEGIN
  IF NEW.status NOT IN ('locked','in_progress','waiting_approval','completed','on_hold','rejected') THEN
    RAISE EXCEPTION 'Unknown step status %', NEW.status;
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.status = 'locked' AND NEW.status <> 'locked' THEN
    SELECT count(*) INTO pending FROM public.workflow_steps s
      WHERE s.workflow_id = NEW.workflow_id
        AND s.sequence_no < NEW.sequence_no
        AND s.status <> 'completed';
    IF pending > 0 THEN
      RAISE EXCEPTION 'Complete the earlier steps before starting step %', NEW.sequence_no;
    END IF;
  END IF;
  IF NEW.status = 'completed' AND (TG_OP = 'INSERT' OR OLD.status <> 'completed') THEN
    NEW.completed_at := now();
    NEW.completed_by := auth.uid();
  ELSIF NEW.status <> 'completed' THEN
    NEW.completed_at := NULL;
    NEW.completed_by := NULL;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_steps_guard BEFORE INSERT OR UPDATE ON public.workflow_steps
  FOR EACH ROW EXECUTE FUNCTION public.guard_workflow_steps();

-- unlock the next step and close the workflow when all steps are done
CREATE OR REPLACE FUNCTION public.after_workflow_step_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE remaining integer;
BEGIN
  IF NEW.status = 'completed' THEN
    UPDATE public.workflow_steps s SET status = 'in_progress'
      WHERE s.workflow_id = NEW.workflow_id AND s.status = 'locked'
        AND s.sequence_no = (
          SELECT MIN(sequence_no) FROM public.workflow_steps
          WHERE workflow_id = NEW.workflow_id AND status = 'locked'
        )
        AND NOT EXISTS (
          SELECT 1 FROM public.workflow_steps p
          WHERE p.workflow_id = NEW.workflow_id AND p.sequence_no < s.sequence_no AND p.status <> 'completed'
        );
    SELECT count(*) INTO remaining FROM public.workflow_steps
      WHERE workflow_id = NEW.workflow_id AND status <> 'completed';
    IF remaining = 0 THEN
      UPDATE public.workflows SET status = 'completed', updated_at = now()
        WHERE id = NEW.workflow_id AND status <> 'cancelled';
    END IF;
  END IF;
  RETURN NULL;
END; $$;
CREATE TRIGGER trg_steps_after AFTER UPDATE OF status ON public.workflow_steps
  FOR EACH ROW EXECUTE FUNCTION public.after_workflow_step_change();

REVOKE ALL ON FUNCTION public.guard_workflow_steps() FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.after_workflow_step_change() FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_workflow_no() FROM public, anon, authenticated;

-- step documents
CREATE TABLE public.workflow_step_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  step_id uuid NOT NULL REFERENCES public.workflow_steps(id) ON DELETE CASCADE,
  file_path text NOT NULL,
  file_name text NOT NULL,
  mime_type text,
  size_bytes integer,
  uploaded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workflow_step_documents TO authenticated;
GRANT ALL ON public.workflow_step_documents TO service_role;
ALTER TABLE public.workflow_step_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff read step docs" ON public.workflow_step_documents FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.workflow_steps s JOIN public.workflows w ON w.id = s.workflow_id
    WHERE s.id = step_id AND public.can_access_company(w.company_id)));
CREATE POLICY "staff insert step docs" ON public.workflow_step_documents FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.workflow_steps s JOIN public.workflows w ON w.id = s.workflow_id
    WHERE s.id = step_id AND public.can_access_company(w.company_id)));
CREATE POLICY "staff delete step docs" ON public.workflow_step_documents FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.workflow_steps s JOIN public.workflows w ON w.id = s.workflow_id
    WHERE s.id = step_id AND public.can_access_company(w.company_id)));
CREATE INDEX idx_step_docs_step ON public.workflow_step_documents(step_id);

-- seeded templates
INSERT INTO public.workflow_templates (code, name, name_ar, description) VALUES
  ('new_visa', 'New Visa Workflow', 'مسار تأشيرة جديدة', 'Full 10-step new employment visa process'),
  ('visa_renewal', 'Visa Renewal Workflow', 'مسار تجديد التأشيرة', 'Standard 7-step residency renewal process');

INSERT INTO public.workflow_template_steps (template_id, sequence_no, name, description, requirement)
SELECT t.id, v.seq, v.name, v.descr, 'required'
FROM public.workflow_templates t
JOIN (VALUES
  (1,'Offer Letter','Issue and verify standard MoHRE electronic offer letter signed by both candidate and company.'),
  (2,'Labour Insurance – WPP','Subscribe to the Workers Protection Program (WPP) insurance policy via the insurance portal.'),
  (3,'Labour Card Payment','Settle electronic work permit approval transaction fee on the MoHRE Tasheel portal.'),
  (4,'Issue New Visa','Submit entry permit application through GDRFA (Dubai) or ICP (Federal) immigration channel.'),
  (5,'Change Status','Process in-country status change or airport arrival confirmation stamp.'),
  (6,'ILOE Insurance','Enroll employee in the mandatory Involuntary Loss of Employment national insurance scheme.'),
  (7,'Twajeeh Payment','Settle mandatory MoHRE worker awareness and orientation training fee.'),
  (8,'Medical Fitness','Complete medical fitness screening (blood test & chest X-ray) at an authorized DHA/SEHA center.'),
  (9,'Health Insurance','Issue compliant corporate health insurance card and verify policy certificate.'),
  (10,'ID & Residence','Complete Emirates ID biometrics appointment and electronic residency visa stamping.')
) AS v(seq, name, descr) ON true
WHERE t.code = 'new_visa';

INSERT INTO public.workflow_template_steps (template_id, sequence_no, name, description, requirement)
SELECT t.id, v.seq, v.name, v.descr, 'required'
FROM public.workflow_templates t
JOIN (VALUES
  (1,'Labour Card Renewal Payment','Settle work permit renewal transaction fee on the MoHRE Tasheel portal.'),
  (2,'Labour Insurance – WPP','Renew the Workers Protection Program (WPP) insurance policy.'),
  (3,'ILOE Insurance','Renew the Involuntary Loss of Employment national insurance subscription.'),
  (4,'Medical Fitness','Complete renewal medical fitness screening at an authorized DHA/SEHA center.'),
  (5,'Health Insurance','Renew corporate health insurance card and verify the policy certificate.'),
  (6,'Visa Renewal Application','Submit residency renewal application through GDRFA or ICP immigration channel.'),
  (7,'ID & Residence','Renew Emirates ID and complete electronic residency visa stamping.')
) AS v(seq, name, descr) ON true
WHERE t.code = 'visa_renewal';