import { supabase } from "@/integrations/supabase/client";

/**
 * General ledger derived from the portal's source documents.
 *
 * Invoices, receipts, payment vouchers and salary payments are not posted to
 * journal_entries by the database, so the financial statements build a
 * double-entry ledger from them here, then add manually posted journal vouchers.
 * The account codes used for each document type are listed in POSTING_RULES so
 * the mapping is visible to accountants in the UI.
 */

export type AccountType = "asset" | "liability" | "equity" | "income" | "expense";

export type Account = {
  code: string;
  name: string;
  type: AccountType;
  parent_code: string | null;
  opening_balance: number;
};

export type LedgerSource = "invoice" | "receipt" | "voucher" | "salary" | "journal";

export type Posting = {
  date: string;
  account: string;
  debit: number;
  credit: number;
  source: LedgerSource;
  ref: string;
  memo: string;
};

export const ACC = {
  cash: "1100",
  bank: "1200",
  receivable: "1300",
  payable: "2100",
  vat: "2200",
  retained: "3200",
  serviceRevenue: "4100",
  govtRecovery: "4300",
  govtPaid: "5100",
  salaries: "5200",
  officeAdmin: "5500",
} as const;

export const POSTING_RULES: { source: string; rule: string }[] = [
  { source: "Invoice (not cancelled)", rule: `Dr ${ACC.receivable} total · Cr ${ACC.serviceRevenue} service charge · Cr ${ACC.govtRecovery} govt fees · Cr ${ACC.vat} VAT` },
  { source: "Receipt", rule: `Dr ${ACC.cash} (cash) or ${ACC.bank} (other methods) · Cr ${ACC.receivable}` },
  { source: "Payment voucher (approved / paid)", rule: `Dr voucher account (default ${ACC.officeAdmin}) · Cr ${ACC.cash}/${ACC.bank} when paid, ${ACC.payable} when only approved` },
  { source: "Salary payment", rule: `Dr ${ACC.salaries} net pay · Cr ${ACC.cash}/${ACC.bank} when paid, ${ACC.payable} when pending` },
  { source: "Journal voucher (posted)", rule: "Lines posted exactly as entered" },
];

const n = (v: unknown) => Number(v ?? 0) || 0;
const r2 = (v: number) => Math.round(v * 100) / 100;
const cashAccount = (method: string | null | undefined) => (method === "cash" ? ACC.cash : ACC.bank);

/** Supabase caps a select at 1000 rows; page through everything. */
async function fetchAll<T>(build: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>) {
  const size = 1000;
  let out: T[] = [];
  for (let from = 0; ; from += size) {
    const { data, error } = await build(from, from + size - 1);
    if (error) throw error;
    out = out.concat(data ?? []);
    if (!data || data.length < size) return out;
  }
}

export async function loadLedger(): Promise<{ accounts: Account[]; postings: Posting[] }> {
  const [accounts, invoices, receipts, vouchers, salaries, journals] = await Promise.all([
    fetchAll((a, b) => supabase.from("accounts").select("code, name, type, parent_code, opening_balance").order("code").range(a, b)),
    fetchAll((a, b) =>
      supabase.from("invoices").select("id, invoice_no, issue_date, status, subtotal, govt_fees, vat_amount, total").neq("status", "cancelled").range(a, b),
    ),
    fetchAll((a, b) => supabase.from("receipts").select("id, receipt_no, received_on, amount, method").range(a, b)),
    fetchAll((a, b) =>
      supabase
        .from("payment_vouchers")
        .select("id, voucher_no, voucher_date, payee, account_code, amount, method, status, description")
        .in("status", ["approved", "paid"])
        .range(a, b),
    ),
    fetchAll((a, b) =>
      supabase.from("salary_payments").select("id, payment_no, staff_name, period_month, paid_on, net_pay, method, status").neq("status", "cancelled").range(a, b),
    ),
    fetchAll((a, b) =>
      supabase
        .from("journal_entries")
        .select("id, entry_no, entry_date, memo, status, journal_lines(account_code, debit, credit, description)")
        .eq("status", "posted")
        .range(a, b),
    ),
  ]);

  const postings: Posting[] = [];
  const push = (p: Omit<Posting, "debit" | "credit"> & { debit?: number; credit?: number }) => {
    const debit = r2(n(p.debit));
    const credit = r2(n(p.credit));
    if (debit === 0 && credit === 0) return;
    postings.push({ ...p, debit, credit });
  };

  for (const i of invoices) {
    const base = { date: i.issue_date, source: "invoice" as const, ref: i.invoice_no, memo: "Invoice" };
    push({ ...base, account: ACC.receivable, debit: n(i.total) });
    push({ ...base, account: ACC.serviceRevenue, credit: n(i.subtotal) });
    push({ ...base, account: ACC.govtRecovery, credit: n(i.govt_fees) });
    push({ ...base, account: ACC.vat, credit: n(i.vat_amount) });
    // Guard against rounding differences between stored totals and components
    const diff = r2(n(i.total) - n(i.subtotal) - n(i.govt_fees) - n(i.vat_amount));
    if (diff !== 0) push({ ...base, account: ACC.serviceRevenue, credit: diff > 0 ? diff : 0, debit: diff < 0 ? -diff : 0 });
  }

  for (const r of receipts) {
    const base = { date: r.received_on, source: "receipt" as const, ref: r.receipt_no, memo: `Receipt (${r.method})` };
    push({ ...base, account: cashAccount(r.method), debit: n(r.amount) });
    push({ ...base, account: ACC.receivable, credit: n(r.amount) });
  }

  for (const v of vouchers) {
    const base = { date: v.voucher_date, source: "voucher" as const, ref: v.voucher_no, memo: v.description || v.payee };
    push({ ...base, account: v.account_code || ACC.officeAdmin, debit: n(v.amount) });
    push({ ...base, account: v.status === "paid" ? cashAccount(v.method) : ACC.payable, credit: n(v.amount) });
  }

  for (const s of salaries) {
    const paid = s.status === "paid";
    const base = { date: s.period_month, source: "salary" as const, ref: s.payment_no, memo: `Salary — ${s.staff_name}` };
    push({ ...base, account: ACC.salaries, debit: n(s.net_pay) });
    push({ ...base, account: paid ? cashAccount(s.method) : ACC.payable, credit: n(s.net_pay) });
  }

  for (const j of journals as { entry_no: string; entry_date: string; memo: string | null; journal_lines: { account_code: string; debit: number; credit: number; description: string | null }[] }[]) {
    for (const l of j.journal_lines ?? []) {
      push({
        date: j.entry_date,
        account: l.account_code,
        debit: n(l.debit),
        credit: n(l.credit),
        source: "journal",
        ref: j.entry_no,
        memo: l.description || j.memo || "Journal",
      });
    }
  }

  postings.sort((a, b) => a.date.localeCompare(b.date) || a.ref.localeCompare(b.ref));
  return {
    accounts: (accounts as Account[]).map((a) => ({ ...a, opening_balance: n(a.opening_balance) })),
    postings,
  };
}

const TYPE_BY_DIGIT: Record<string, AccountType> = { "1": "asset", "2": "liability", "3": "equity", "4": "income", "5": "expense" };

/** Resolve an account, including codes used in postings that are missing from the chart. */
export function accountInfo(accounts: Account[], code: string): Account {
  return (
    accounts.find((a) => a.code === code) ?? {
      code,
      name: `Unknown account ${code}`,
      type: TYPE_BY_DIGIT[code.charAt(0)] ?? "expense",
      parent_code: null,
      opening_balance: 0,
    }
  );
}

export const isDebitNature = (t: AccountType) => t === "asset" || t === "expense";

/** Opening balances are stored as positive amounts on the account's natural side. */
export function openingDebitCredit(a: Account) {
  const v = a.opening_balance;
  return isDebitNature(a.type) ? { debit: v, credit: 0 } : { debit: 0, credit: v };
}

export type Balance = { account: Account; debit: number; credit: number; net: number };

/**
 * Per-account totals for postings within [from, to] (inclusive, ISO dates; either may be empty).
 * `net` is signed to the account's natural side (positive = normal balance).
 */
export function balances(
  accounts: Account[],
  postings: Posting[],
  { from, to, includeOpening }: { from?: string; to?: string; includeOpening: boolean },
): Balance[] {
  const map = new Map<string, { debit: number; credit: number }>();
  const add = (code: string, d: number, c: number) => {
    const cur = map.get(code) ?? { debit: 0, credit: 0 };
    cur.debit += d;
    cur.credit += c;
    map.set(code, cur);
  };
  if (includeOpening) for (const a of accounts) {
    const o = openingDebitCredit(a);
    if (o.debit || o.credit) add(a.code, o.debit, o.credit);
  }
  for (const p of postings) {
    if (from && p.date < from) continue;
    if (to && p.date > to) continue;
    add(p.account, p.debit, p.credit);
  }
  return Array.from(map.entries())
    .map(([code, v]) => {
      const account = accountInfo(accounts, code);
      const debit = r2(v.debit);
      const credit = r2(v.credit);
      return { account, debit, credit, net: r2(isDebitNature(account.type) ? debit - credit : credit - debit) };
    })
    .sort((a, b) => a.account.code.localeCompare(b.account.code));
}

export type ProfitAndLoss = {
  income: Balance[];
  expenses: Balance[];
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  passThrough: number;
};

/**
 * Profit & loss for a period. With `excludePassThrough`, government fees recovered from
 * customers (4300) and government fees paid (5100) are left out, since they are charged at actual.
 */
export function profitAndLoss(
  accounts: Account[],
  postings: Posting[],
  from: string,
  to: string,
  excludePassThrough: boolean,
): ProfitAndLoss {
  const rows = balances(accounts, postings, { from, to, includeOpening: false });
  const skip = (b: Balance) => excludePassThrough && (b.account.code === ACC.govtRecovery || b.account.code === ACC.govtPaid);
  const income = rows.filter((b) => b.account.type === "income" && !skip(b) && b.net !== 0);
  const expenses = rows.filter((b) => b.account.type === "expense" && !skip(b) && b.net !== 0);
  const totalIncome = r2(income.reduce((s, b) => s + b.net, 0));
  const totalExpenses = r2(expenses.reduce((s, b) => s + b.net, 0));
  const passThrough = r2(
    rows.filter((b) => b.account.code === ACC.govtRecovery).reduce((s, b) => s + b.net, 0) -
      rows.filter((b) => b.account.code === ACC.govtPaid).reduce((s, b) => s + b.net, 0),
  );
  return { income, expenses, totalIncome, totalExpenses, netProfit: r2(totalIncome - totalExpenses), passThrough };
}

/** Shift an ISO date range back by its own length (for "previous period" comparisons). */
export function previousPeriod(from: string, to: string) {
  const f = new Date(from + "T00:00:00Z");
  const t = new Date(to + "T00:00:00Z");
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const isMonthEnd = (d: Date) => new Date(d.getTime() + 86400000).getUTCDate() === 1;
  // Year-to-date (or a full year): same dates last year
  if (f.getUTCMonth() === 0 && f.getUTCDate() === 1 && f.getUTCFullYear() === t.getUTCFullYear()) {
    const y = f.getUTCFullYear() - 1;
    const lastDay = new Date(Date.UTC(y, t.getUTCMonth() + 1, 0)).getUTCDate();
    return { from: `${y}-01-01`, to: iso(new Date(Date.UTC(y, t.getUTCMonth(), Math.min(t.getUTCDate(), lastDay)))) };
  }
  // Whole calendar months (e.g. "This month" once it's over, a quarter, a year): compare with the same number of months before
  if (f.getUTCDate() === 1 && isMonthEnd(t)) {
    const months = (t.getUTCFullYear() - f.getUTCFullYear()) * 12 + t.getUTCMonth() - f.getUTCMonth() + 1;
    const pf = new Date(Date.UTC(f.getUTCFullYear(), f.getUTCMonth() - months, 1));
    const pt = new Date(Date.UTC(f.getUTCFullYear(), f.getUTCMonth(), 0));
    return { from: iso(pf), to: iso(pt) };
  }
  // Month-to-date style ranges starting on the 1st: same days of the previous month(s)
  if (f.getUTCDate() === 1) {
    const months = (t.getUTCFullYear() - f.getUTCFullYear()) * 12 + t.getUTCMonth() - f.getUTCMonth() + 1;
    const pf = new Date(Date.UTC(f.getUTCFullYear(), f.getUTCMonth() - months, 1));
    const lastOfPrevTo = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() - months + 1, 0)).getUTCDate();
    const pt = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() - months, Math.min(t.getUTCDate(), lastOfPrevTo)));
    return { from: iso(pf), to: iso(pt) };
  }
  const days = Math.round((t.getTime() - f.getTime()) / 86400000) + 1;
  const pt = new Date(f.getTime() - 86400000);
  const pf = new Date(pt.getTime() - (days - 1) * 86400000);
  return { from: iso(pf), to: iso(pt) };
}

export const today = () => new Date().toISOString().slice(0, 10);
export const monthStart = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
};
export const yearStart = () => `${new Date().getFullYear()}-01-01`;
