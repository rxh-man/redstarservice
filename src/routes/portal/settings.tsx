import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Panel, PortalHeading } from "@/lib/portal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/portal/settings")({ component: SettingsPage });

const FIELDS = [
  ["company_name", "Company name"],
  ["company_name_ar", "Company name (Arabic)"],
  ["phone", "Phone"],
  ["email", "Email"],
  ["trn", "TRN"],
  ["vat_rate", "VAT rate (%)"],
  ["invoice_prefix", "Invoice number prefix"],
  ["receipt_prefix", "Receipt number prefix"],
] as const;

function SettingsPage() {
  const qc = useQueryClient();
  const [form, setForm] = useState<Record<string, string>>({});

  const { data } = useQuery({
    queryKey: ["portal", "settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("settings").select("*").maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (!data) return;
    setForm({
      company_name: data.company_name ?? "",
      company_name_ar: data.company_name_ar ?? "",
      phone: data.phone ?? "",
      email: data.email ?? "",
      trn: data.trn ?? "",
      vat_rate: String(data.vat_rate ?? 5),
      invoice_prefix: data.invoice_prefix ?? "",
      receipt_prefix: data.receipt_prefix ?? "",
      address: data.address ?? "",
      footer_note: data.footer_note ?? "",
    });
  }, [data]);

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("settings")
        .update({
          company_name: form["company_name"],
          company_name_ar: form["company_name_ar"] || null,
          phone: form["phone"] || null,
          email: form["email"] || null,
          trn: form["trn"] || null,
          vat_rate: Number(form["vat_rate"]) || 5,
          invoice_prefix: form["invoice_prefix"] || "RS-INV-",
          receipt_prefix: form["receipt_prefix"] || "RS-RCT-",
          address: form["address"] || null,
          footer_note: form["footer_note"] || null,
        } as never)
        .eq("id", true);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Settings saved");
      void qc.invalidateQueries({ queryKey: ["portal"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="max-w-3xl">
      <PortalHeading
        title="Company Settings"
        subtitle="Details printed on every invoice and receipt, plus numbering and VAT defaults."
      />

      <Panel className="p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          {FIELDS.map(([key, label]) => (
            <div key={key} className="space-y-1.5">
              <Label htmlFor={key}>{label}</Label>
              <Input
                id={key}
                value={form[key] ?? ""}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              />
            </div>
          ))}
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="addr">Address</Label>
            <Input
              id="addr"
              value={form["address"] ?? ""}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="foot">Invoice footer note</Label>
            <Textarea
              id="foot"
              value={form["footer_note"] ?? ""}
              onChange={(e) => setForm({ ...form, footer_note: e.target.value })}
            />
          </div>
        </div>
        <div className="mt-6">
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            Save settings
          </Button>
        </div>
      </Panel>
    </div>
  );
}
