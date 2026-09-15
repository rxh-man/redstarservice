DROP POLICY "staff read invoices" ON public.invoices;
CREATE POLICY "staff read invoices" ON public.invoices
FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'accountant'::app_role)
  OR created_by = auth.uid()
);