
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_staff(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.my_roles() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.touch_updated_at() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.recalc_invoice(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.trg_recalc_items() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_invoice_no() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_receipt_no() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.my_roles() TO authenticated, service_role;
