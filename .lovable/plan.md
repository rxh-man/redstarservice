# Add company & workflow tracking to the existing portal

Keep everything that already works (customers, invoices, receipts, accounts, jobs, services, reports, users) exactly as it is, in the same simple minimal style. This only adds three new pages and one alert strip.

## What gets added

**1. Companies**
A list of corporate clients with trade licence number, licence expiry and establishment card expiry. Each company has its own page showing its details, its employees, its workflows and the typist assigned to it.

**2. Employees**
People belonging to a company, with passport, visa, Emirates ID and labour card numbers plus expiry dates. Colour dots show what is expiring soon (red under 30 days, amber under 90).

**3. Workflows**
Start a workflow for an employee — "New Visa" (10 steps) or "Visa Renewal" (7 steps) — from ready-made step templates. The workflow page shows numbered steps in a simple table: step name, short description, status, assigned typist, documents, action.
- One step open at a time; later steps stay locked until the earlier one is completed, so nothing gets skipped.
- Clicking a step opens a side panel to set status (In Progress, Waiting for Approval, Completed, On Hold, Rejected), assign a typist, add notes, and attach files (PDF/PNG/JPG).
- Progress counter, e.g. "3 of 10 completed".

**4. Expiry alerts**
A small banner on the dashboard listing documents expiring in the next 60 days, so nothing is missed. Typists only see companies assigned to them.

## Technical notes

- New tables: `companies`, `company_employees`, `workflow_templates`, `workflow_template_steps`, `workflows`, `workflow_steps`, `workflow_step_documents`; plus a private `documents` storage bucket for step attachments.
- RLS: admins/accountants full access; typists read companies assigned to them (`assigned_typist`) and update steps assigned to them. GRANTs on every new table.
- Step locking and progress counters enforced by trigger (`sequence_no`, `status`), not only in the UI.
- Seed the two step templates (New Visa 10 steps, Visa Renewal 7 steps) as literal INSERTs in the migration, matching the wording in the screenshots.
- New routes reuse `PortalProvider`, existing panel/badge helpers and nav in `src/routes/portal/route.tsx`: `companies.index.tsx`, `companies.$id.tsx`, `employees.tsx`, `workflows.index.tsx`, `workflows.$id.tsx`.
- Optional link from a completed workflow to create an invoice from its billable steps (reuses existing invoice flow).
