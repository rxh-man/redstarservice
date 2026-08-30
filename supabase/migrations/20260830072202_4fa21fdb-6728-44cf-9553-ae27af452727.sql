
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
REVOKE ALL ON FUNCTION public.is_staff(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.my_roles() FROM anon;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.touch_updated_at() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.recalc_invoice(uuid) FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.trg_recalc_items() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.set_invoice_no() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.set_receipt_no() FROM anon, authenticated;
