import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { AlertTriangle, Info, Printer, TrendingDown, TrendingUp } from "lucide-react";
import logo from "@/assets/red-star-logo.png";
import { supabase } from "@/integrations/supabase/client";
import { AED, Panel, PortalHeading, fmtDate, usePortal } from "@/lib/portal";
import {
  ACC,
  POSTING_RULES,
  accountInfo,
  balances,
  isDebitNature,
  loadLedger,
  monthStart,
  previousPeriod,
  profitAndLoss,
  today,
  yearStart,
  type Account,
  type Balance,
  type Posting,
} from "@/lib/ledger";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/portal/financials")({ component: Financials });

const SOURCE_LABEL: Record<Posting["source"], string> = {
  invoice: "Invoice",
  receipt: "Receipt",
  voucher: "Payment voucher",
  salary: "Salary",
  journal: "Journal",
};

function shiftMonth(offset: number) {
  const d = new Date();
  const f = new Date(Date.UTC(d.getFullYear(), d.getMonth() + offset, 1));
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth() + offset + 1, 0));
  return { from: f.toISOString().slice(0, 10), to: t.toISOString().slice(0, 10) };
}

function quarterStart() {
  const d = new Date();
  const m = Math.floor(d.getMonth() / 3) * 3;
  return `${d.getFullYear()}-${String(m + 1).padStart(2, "0")}-01`;
}

const pct = (cur: number, prev: number) => (prev === 0 ? null : ((cur - prev) / Math.abs(prev)) * 100);

function Financials() {
  const { isAccountant } = usePortal();
  const { data, isLoading, error } = useQuery({
    queryKey: ["portal", "ledger"],
    queryFn: loadLedger,
    enabled: isAccountant,
  });
  const { data: settings } = useQuery({
    queryKey: ["portal", "settings", "print"],
    queryFn: async () => (await supabase.from("settings").select("company_name, address, phone, trn").maybeSingle()).data,
  });

  if (!isAccountant) {
    return <Panel className="p-8 text-center text-sm text-muted-foreground">Financial statements are available to accountants and administrators.</Panel>;
  }

  return (
    <div>
      <PortalHeading
        title="Financial Statements"
        subtitle="Profit & loss, balance sheet, trial balance and general ledger — built from invoices, receipts, vouchers, payroll and posted journals."
        actions={
          <Button size="sm" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" /> Print / PDF
          </Button>
        }
      />

      <div className="mb-6 hidden items-center gap-4 border-b border-border pb-4 print:flex">
        <img src={logo} alt="Red Star Services" className="h-14 w-auto object-contain" />
        <div>
          <div className="font-semibold">{settings?.company_name ?? "Red Star Services"}</div>
          <div className="text-xs text-muted-foreground">
            {settings?.address} · {settings?.phone}
          </div>
          <div className="text-xs text-muted-foreground">TRN: {settings?.trn}</div>
        </div>
      </div>

      {error ? (
        <Panel className="p-6 text-sm text-destructive">Could not load the ledger: {(error as Error).message}</Panel>
      ) : isLoading || !data ? (
        <Panel className="p-8 text-center text-sm text-muted-foreground">Building ledger…</Panel>
      ) : (
        <Tabs defaultValue="pnl">
          <TabsList className="mb-6 print:hidden">
            <TabsTrigger value="pnl">Profit &amp; Loss</TabsTrigger>
            <TabsTrigger value="bs">Balance Sheet</TabsTrigger>
            <TabsTrigger value="tb">Trial Balance</TabsTrigger>
            <TabsTrigger value="gl">General Ledger</TabsTrigger>
          </TabsList>
          <TabsContent value="pnl">
            <ProfitLoss accounts={data.accounts} postings={data.postings} />
          </TabsContent>
          <TabsContent value="bs">
            <BalanceSheet accounts={data.accounts} postings={data.postings} />
          </TabsContent>
          <TabsContent value="tb">
            <TrialBalance accounts={data.accounts} postings={data.postings} />
          </TabsContent>
          <TabsContent value="gl">
            <GeneralLedger accounts={data.accounts} postings={data.postings} />
          </TabsContent>
        </Tabs>
      )}

      <Panel className="mt-10 p-5 print:hidden">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Info className="h-4 w-4 text-[color:var(--brand-red)]" /> How the ledger is built
        </div>
        <ul className="mt-3 space-y-1.5 text-xs text-muted-foreground">
          {POSTING_RULES.map((r) => (
            <li key={r.source}>
              <span className="font-medium text-foreground">{r.source}:</span> {r.rule}
            </li>
          ))}
          <li>
            Record each transaction once. Don't also post a manual journal for something already entered as an invoice,
            receipt, voucher or salary payment, or it will be counted twice.
          </li>
        </ul>
      </Panel>
    </div>
  );
}

type LedgerProps = { accounts: Account[]; postings: Posting[] };

function RangePicker({
  from,
  to,
  setRange,
}: {
  from: string;
  to: string;
  setRange: (r: { from: string; to: string }) => void;
}) {
  const presets = [
    { label: "This month", r: { from: monthStart(), to: today() } },
    { label: "Last month", r: shiftMonth(-1) },
    { label: "This quarter", r: { from: quarterStart(), to: today() } },
    { label: "Year to date", r: { from: yearStart(), to: today() } },
    {
      label: "Last year",
      r: { from: `${new Date().getFullYear() - 1}-01-01`, to: `${new Date().getFullYear() - 1}-12-31` },
    },
  ];
  return (
    <>
      <div className="space-y-1.5">
        <Label htmlFor="fs-from">From</Label>
        <Input id="fs-from" type="date" value={from} onChange={(e) => setRange({ from: e.target.value, to })} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="fs-to">To</Label>
        <Input id="fs-to" type="date" value={to} onChange={(e) => setRange({ from, to: e.target.value })} />
      </div>
      <div className="flex flex-wrap gap-2">
        {presets.map((p) => (
          <Button
            key={p.label}
            size="sm"
            variant={p.r.from === from && p.r.to === to ? "default" : "outline"}
            onClick={() => setRange(p.r)}
          >
            {p.label}
          </Button>
        ))}
      </div>
    </>
  );
}

function Delta({ cur, prev, invert = false }: { cur: number; prev: number; invert?: boolean }) {
  const p = pct(cur, prev);
  if (p === null) return <span className="text-muted-foreground">—</span>;
  const good = invert ? p <= 0 : p >= 0;
  return (
    <span className={`inline-flex items-center gap-1 ${good ? "text-emerald-700" : "text-red-700"}`}>
      {p >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {Math.abs(p).toFixed(1)}%
    </span>
  );
}

function ProfitLoss({ accounts, postings }: LedgerProps) {
  const [range, setRange] = useState({ from: monthStart(), to: today() });
  const [excludePassThrough, setExcludePassThrough] = useState(true);
  const prev = previousPeriod(range.from, range.to);

  const cur = useMemo(
    () => profitAndLoss(accounts, postings, range.from, range.to, excludePassThrough),
    [accounts, postings, range, excludePassThrough],
  );
  const old = useMemo(
    () => profitAndLoss(accounts, postings, prev.from, prev.to, excludePassThrough),
    [accounts, postings, prev.from, prev.to, excludePassThrough],
  );

  const prevOf = (list: Balance[], code: string) => list.find((b) => b.account.code === code)?.net ?? 0;
  const margin = cur.totalIncome ? (cur.netProfit / cur.totalIncome) * 100 : 0;

  const section = (title: string, ar: string, rows: Balance[], prevRows: Balance[], total: number, prevTotal: number, invert: boolean) => {
    const codes = Array.from(new Set([...rows, ...prevRows].map((b) => b.account.code))).sort();
    return (
      <>
        <tr className="bg-muted/50">
          <td colSpan={4} className="px-4 py-2 text-xs font-semibold uppercase tracking-wider">
            {title} <span className="arabic ms-1 text-xs normal-case">{ar}</span>
          </td>
        </tr>
        {codes.map((code) => {
          const a = accountInfo(accounts, code);
          const c = prevOf(rows, code);
          const p = prevOf(prevRows, code);
          return (
            <tr key={code}>
              <td className="px-4 py-2.5">
                <span className="me-2 font-mono text-xs text-muted-foreground">{code}</span>
                {a.name}
              </td>
              <td className="px-4 py-2.5 text-right tabular-nums">{AED(c)}</td>
              <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">{AED(p)}</td>
              <td className="px-4 py-2.5 text-right text-xs">
                <Delta cur={c} prev={p} invert={invert} />
              </td>
            </tr>
          );
        })}
        {codes.length === 0 ? (
          <tr>
            <td colSpan={4} className="px-4 py-3 text-sm text-muted-foreground">
              Nothing recorded.
            </td>
          </tr>
        ) : null}
        <tr className="border-t border-border font-semibold">
          <td className="px-4 py-2.5">Total {title.toLowerCase()}</td>
          <td className="px-4 py-2.5 text-right tabular-nums">{AED(total)}</td>
          <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">{AED(prevTotal)}</td>
          <td className="px-4 py-2.5 text-right text-xs">
            <Delta cur={total} prev={prevTotal} invert={invert} />
          </td>
        </tr>
      </>
    );
  };

  return (
    <div>
      <Panel className="mb-6 flex flex-wrap items-end gap-4 p-4 print:hidden">
        <RangePicker from={range.from} to={range.to} setRange={setRange} />
        <label className="ms-auto flex items-center gap-2 text-sm">
          <Switch checked={excludePassThrough} onCheckedChange={setExcludePassThrough} />
          Exclude government fees (pass-through)
        </label>
      </Panel>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Revenue", value: cur.totalIncome, prev: old.totalIncome },
          { label: "Expenses", value: cur.totalExpenses, prev: old.totalExpenses, invert: true },
          { label: "Net profit", value: cur.netProfit, prev: old.netProfit, strong: true },
        ].map((k) => (
          <Panel key={k.label} className="p-5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{k.label}</div>
            <div className={`mt-2 text-xl font-semibold tracking-tight ${k.strong && k.value < 0 ? "text-red-700" : ""}`}>
              {AED(k.value)}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              vs {AED(k.prev)} · <Delta cur={k.value} prev={k.prev} invert={k.invert} />
            </div>
          </Panel>
        ))}
        <Panel className="p-5">
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Net margin</div>
          <div className="mt-2 text-xl font-semibold tracking-tight">{cur.totalIncome ? `${margin.toFixed(1)}%` : "—"}</div>
          <div className="mt-1 text-xs text-muted-foreground">Net profit ÷ revenue</div>
        </Panel>
      </div>

      <Panel className="mt-6 overflow-x-auto">
        <div className="border-b border-border px-4 py-3 text-sm font-semibold">
          Profit &amp; Loss Statement <span className="arabic text-xs text-muted-foreground">قائمة الأرباح والخسائر</span>
          <div className="text-xs font-normal text-muted-foreground">
            {fmtDate(range.from)} — {fmtDate(range.to)}, compared with {fmtDate(prev.from)} — {fmtDate(prev.to)}
          </div>
        </div>
        <table className="w-full min-w-[640px] text-sm">
          <thead className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Account</th>
              <th className="px-4 py-3 text-right">This period</th>
              <th className="px-4 py-3 text-right">Previous period</th>
              <th className="px-4 py-3 text-right">Change</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {section("Revenue", "الإيرادات", cur.income, old.income, cur.totalIncome, old.totalIncome, false)}
            {section("Expenses", "المصروفات", cur.expenses, old.expenses, cur.totalExpenses, old.totalExpenses, true)}
            <tr className="border-t-2 border-foreground/20 bg-muted/40 text-base font-semibold">
              <td className="px-4 py-3">Net profit / (loss)</td>
              <td className={`px-4 py-3 text-right tabular-nums ${cur.netProfit < 0 ? "text-red-700" : ""}`}>{AED(cur.netProfit)}</td>
              <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{AED(old.netProfit)}</td>
              <td className="px-4 py-3 text-right text-xs">
                <Delta cur={cur.netProfit} prev={old.netProfit} />
              </td>
            </tr>
          </tbody>
        </table>
      </Panel>

      {excludePassThrough ? (
        <p className="mt-3 text-xs text-muted-foreground">
          Government fees recovered ({ACC.govtRecovery}) and paid ({ACC.govtPaid}) are excluded. Net difference this period:{" "}
          <span className="font-medium text-foreground">{AED(cur.passThrough)}</span>. Government fee payments are only
          counted if you record them as payment vouchers or journals against account {ACC.govtPaid}.
        </p>
      ) : null}
    </div>
  );
}

function BalanceSheet({ accounts, postings }: LedgerProps) {
  const [asOf, setAsOf] = useState(today());
  const rows = useMemo(() => balances(accounts, postings, { to: asOf, includeOpening: true }), [accounts, postings, asOf]);

  const of = (t: Account["type"]) => rows.filter((b) => b.account.type === t && b.net !== 0);
  const sum = (list: Balance[]) => list.reduce((s, b) => s + b.net, 0);
  const assets = of("asset");
  const liabilities = of("liability");
  const equity = of("equity");
  const earnings = sum(of("income")) - sum(of("expense"));
  const totalAssets = sum(assets);
  const totalLiabilities = sum(liabilities);
  const totalEquity = sum(equity) + earnings;
  const diff = Math.round((totalAssets - totalLiabilities - totalEquity) * 100) / 100;

  const block = (title: string, ar: string, list: Balance[], extra?: { label: string; value: number }) => (
    <Panel className="overflow-hidden">
      <div className="border-b border-border px-4 py-3 text-sm font-semibold">
        {title} <span className="arabic text-xs text-muted-foreground">{ar}</span>
      </div>
      <table className="w-full text-sm">
        <tbody className="divide-y divide-border">
          {list.map((b) => (
            <tr key={b.account.code}>
              <td className="px-4 py-2.5">
                <span className="me-2 font-mono text-xs text-muted-foreground">{b.account.code}</span>
                {b.account.name}
              </td>
              <td className="px-4 py-2.5 text-right tabular-nums">{AED(b.net)}</td>
            </tr>
          ))}
          {extra ? (
            <tr>
              <td className="px-4 py-2.5 italic">{extra.label}</td>
              <td className="px-4 py-2.5 text-right tabular-nums">{AED(extra.value)}</td>
            </tr>
          ) : null}
          {list.length === 0 && !extra ? (
            <tr>
              <td className="px-4 py-3 text-muted-foreground" colSpan={2}>
                Nothing recorded.
              </td>
            </tr>
          ) : null}
          <tr className="bg-muted/40 font-semibold">
            <td className="px-4 py-2.5">Total {title.toLowerCase()}</td>
            <td className="px-4 py-2.5 text-right tabular-nums">{AED(sum(list) + (extra?.value ?? 0))}</td>
          </tr>
        </tbody>
      </table>
    </Panel>
  );

  return (
    <div>
      <Panel className="mb-6 flex flex-wrap items-end gap-4 p-4 print:hidden">
        <div className="space-y-1.5">
          <Label htmlFor="bs-asof">As of</Label>
          <Input id="bs-asof" type="date" value={asOf} onChange={(e) => setAsOf(e.target.value)} />
        </div>
        <div className="text-sm text-muted-foreground">Includes opening balances from the chart of accounts.</div>
      </Panel>

      {diff !== 0 ? (
        <div className="mb-6 flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            Assets differ from liabilities + equity by <strong>{AED(diff)}</strong>. This usually means the opening
            balances in the chart of accounts don't balance (total debit openings ≠ total credit openings). Adjust them
            in Chart of Accounts, or post an opening-balance journal to equity.
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        {block("Assets", "الأصول", assets)}
        <div className="space-y-6">
          {block("Liabilities", "الخصوم", liabilities)}
          {block("Equity", "حقوق الملكية", equity, { label: "Current earnings (income − expenses to date)", value: earnings })}
        </div>
      </div>

      <Panel className="mt-6 grid gap-4 p-5 sm:grid-cols-3">
        <div>
          <div className="text-xs text-muted-foreground">Total assets</div>
          <div className="text-lg font-semibold">{AED(totalAssets)}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Liabilities + equity</div>
          <div className="text-lg font-semibold">{AED(totalLiabilities + totalEquity)}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Status</div>
          <div className={`text-lg font-semibold ${diff === 0 ? "text-emerald-700" : "text-amber-700"}`}>
            {diff === 0 ? "Balanced" : `Off by ${AED(diff)}`}
          </div>
        </div>
      </Panel>
    </div>
  );
}

function TrialBalance({ accounts, postings }: LedgerProps) {
  const [asOf, setAsOf] = useState(today());
  const rows = useMemo(
    () => balances(accounts, postings, { to: asOf, includeOpening: true }).filter((b) => b.debit !== 0 || b.credit !== 0),
    [accounts, postings, asOf],
  );
  const dr = (b: Balance) => Math.max(b.debit - b.credit, 0);
  const cr = (b: Balance) => Math.max(b.credit - b.debit, 0);
  const totalDr = rows.reduce((s, b) => s + dr(b), 0);
  const totalCr = rows.reduce((s, b) => s + cr(b), 0);
  const off = Math.round((totalDr - totalCr) * 100) / 100;

  return (
    <div>
      <Panel className="mb-6 flex flex-wrap items-end gap-4 p-4 print:hidden">
        <div className="space-y-1.5">
          <Label htmlFor="tb-asof">As of</Label>
          <Input id="tb-asof" type="date" value={asOf} onChange={(e) => setAsOf(e.target.value)} />
        </div>
      </Panel>
      <Panel className="overflow-x-auto">
        <div className="border-b border-border px-4 py-3 text-sm font-semibold">
          Trial Balance <span className="arabic text-xs text-muted-foreground">ميزان المراجعة</span>
          <div className="text-xs font-normal text-muted-foreground">As of {fmtDate(asOf)}</div>
        </div>
        <table className="w-full min-w-[560px] text-sm">
          <thead className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Account</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3 text-right">Debit</th>
              <th className="px-4 py-3 text-right">Credit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((b) => (
              <tr key={b.account.code}>
                <td className="px-4 py-2.5 font-mono text-xs">{b.account.code}</td>
                <td className="px-4 py-2.5">{b.account.name}</td>
                <td className="px-4 py-2.5 capitalize text-muted-foreground">{b.account.type}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{dr(b) ? AED(dr(b)) : ""}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{cr(b) ? AED(cr(b)) : ""}</td>
              </tr>
            ))}
            <tr className="border-t-2 border-foreground/20 bg-muted/40 font-semibold">
              <td className="px-4 py-3" colSpan={3}>
                Totals {off === 0 ? <span className="ms-2 text-xs font-medium text-emerald-700">Balanced</span> : <span className="ms-2 text-xs font-medium text-amber-700">Difference {AED(off)}</span>}
              </td>
              <td className="px-4 py-3 text-right tabular-nums">{AED(totalDr)}</td>
              <td className="px-4 py-3 text-right tabular-nums">{AED(totalCr)}</td>
            </tr>
          </tbody>
        </table>
      </Panel>
      {off !== 0 ? (
        <p className="mt-3 text-xs text-muted-foreground">
          All transactions post balanced entries, so a difference comes from unbalanced opening balances in the chart of accounts.
        </p>
      ) : null}
    </div>
  );
}

function GeneralLedger({ accounts, postings }: LedgerProps) {
  const [code, setCode] = useState<string>(ACC.cash);
  const [range, setRange] = useState({ from: monthStart(), to: today() });
  const account = accountInfo(accounts, code);
  const usedCodes = useMemo(
    () => Array.from(new Set([...accounts.map((a) => a.code), ...postings.map((p) => p.account)])).sort(),
    [accounts, postings],
  );

  const sign = isDebitNature(account.type) ? 1 : -1;
  const opening = useMemo(() => {
    const base = account.opening_balance;
    const before = postings
      .filter((p) => p.account === code && p.date < range.from)
      .reduce((s, p) => s + (p.debit - p.credit) * sign, 0);
    return base + before;
  }, [postings, code, range.from, account.opening_balance, sign]);

  const lines = postings.filter((p) => p.account === code && p.date >= range.from && p.date <= range.to);
  let running = opening;

  return (
    <div>
      <Panel className="mb-6 flex flex-wrap items-end gap-4 p-4 print:hidden">
        <div className="space-y-1.5">
          <Label htmlFor="gl-acc">Account</Label>
          <select
            id="gl-acc"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            {usedCodes.map((c) => (
              <option key={c} value={c}>
                {c} — {accountInfo(accounts, c).name}
              </option>
            ))}
          </select>
        </div>
        <RangePicker from={range.from} to={range.to} setRange={setRange} />
      </Panel>

      <Panel className="overflow-x-auto">
        <div className="border-b border-border px-4 py-3 text-sm font-semibold">
          {account.code} — {account.name}
          <div className="text-xs font-normal capitalize text-muted-foreground">
            {account.type} · {fmtDate(range.from)} — {fmtDate(range.to)}
          </div>
        </div>
        <table className="w-full min-w-[760px] text-sm">
          <thead className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Reference</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3 text-right">Debit</th>
              <th className="px-4 py-3 text-right">Credit</th>
              <th className="px-4 py-3 text-right">Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            <tr className="bg-muted/40">
              <td className="px-4 py-2.5" colSpan={6}>
                Opening balance brought forward
              </td>
              <td className="px-4 py-2.5 text-right font-medium tabular-nums">{AED(opening)}</td>
            </tr>
            {lines.map((p, i) => {
              running += (p.debit - p.credit) * sign;
              return (
                <tr key={`${p.ref}-${i}`}>
                  <td className="px-4 py-2.5 whitespace-nowrap">{fmtDate(p.date)}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{SOURCE_LABEL[p.source]}</td>
                  <td className="px-4 py-2.5 font-mono text-xs">{p.ref}</td>
                  <td className="px-4 py-2.5">{p.memo}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{p.debit ? AED(p.debit) : ""}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{p.credit ? AED(p.credit) : ""}</td>
                  <td className="px-4 py-2.5 text-right font-medium tabular-nums">{AED(running)}</td>
                </tr>
              );
            })}
            {lines.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  No movements in this period.
                </td>
              </tr>
            ) : null}
            <tr className="border-t-2 border-foreground/20 bg-muted/40 font-semibold">
              <td className="px-4 py-3" colSpan={6}>
                Closing balance
              </td>
              <td className="px-4 py-3 text-right tabular-nums">{AED(running)}</td>
            </tr>
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
