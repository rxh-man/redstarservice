import { supabase } from "@/integrations/supabase/client";

/** Business tables an administrator can browse, edit and audit. `title` picks the column shown as the record's name. */
export const ADMIN_TABLES: { name: string; label: string; title: string[] }[] = [
  { name: "customers", label: "Customers", title: ["name"] },
  { name: "companies", label: "Companies", title: ["name"] },
  { name: "company_employees", label: "Company employees", title: ["name", "designation"] },
  { name: "invoices", label: "Invoices", title: ["invoice_no"] },
  { name: "invoice_items", label: "Invoice items", title: ["description"] },
  { name: "receipts", label: "Receipts", title: ["receipt_no"] },
  { name: "payment_vouchers", label: "Payment vouchers", title: ["voucher_no", "payee"] },
  { name: "journal_entries", label: "Journal vouchers", title: ["entry_no"] },
  { name: "journal_lines", label: "Journal lines", title: ["account_code", "description"] },
  { name: "accounts", label: "Chart of accounts", title: ["code", "name"] },
  { name: "staff_salaries", label: "Staff salaries", title: ["staff_name"] },
  { name: "salary_payments", label: "Salary payments", title: ["payment_no", "staff_name"] },
  { name: "services", label: "Service catalogue", title: ["name"] },
  { name: "typing_jobs", label: "Typing jobs", title: ["job_no", "title"] },
  { name: "workflows", label: "Workflows", title: ["workflow_no", "title"] },
  { name: "workflow_steps", label: "Workflow steps", title: ["sequence_no", "name"] },
  { name: "workflow_templates", label: "Workflow templates", title: ["name"] },
  { name: "workflow_template_steps", label: "Template steps", title: ["sequence_no", "name"] },
  { name: "workflow_step_documents", label: "Step documents", title: ["file_name"] },
  { name: "kiosk_vendors", label: "Kiosk vendors", title: ["kiosk_no", "name"] },
  { name: "kiosk_requests", label: "Kiosk requests", title: ["subject"] },
  { name: "profiles", label: "Staff profiles", title: ["full_name"] },
  { name: "user_roles", label: "User roles", title: ["role", "user_id"] },
  { name: "settings", label: "Settings", title: ["company_name"] },
];

export const tableLabel = (name: string) => ADMIN_TABLES.find((t) => t.name === name)?.label ?? name;

export function recordTitle(table: string, row: Record<string, unknown> | null | undefined) {
  if (!row) return "—";
  const cols = ADMIN_TABLES.find((t) => t.name === table)?.title ?? [];
  const parts = cols.map((c) => row[c]).filter((v) => v !== null && v !== undefined && v !== "");
  return parts.length ? parts.map(String).join(" · ") : String(row.id ?? "—");
}

export const humanize = (key: string) =>
  key.replace(/_/g, " ").replace(/\bid\b/i, "ID").replace(/^./, (c) => c.toUpperCase());

export function formatValue(v: unknown): string {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

/** The typed client only knows literal table names; admin tools work across all of them. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const anyTable = (name: string) => supabase.from(name as any) as any;

export type AuditEntry = {
  id: number;
  table_name: string;
  record_id: string | null;
  action: "INSERT" | "UPDATE" | "DELETE";
  changed_fields: string[];
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  changed_by: string | null;
  changed_by_name: string | null;
  changed_at: string;
};
