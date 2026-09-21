REVOKE ALL ON FUNCTION public.guard_journal_lines() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.guard_journal_post() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.recalc_journal(uuid) FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.trg_recalc_journal() FROM anon, authenticated;