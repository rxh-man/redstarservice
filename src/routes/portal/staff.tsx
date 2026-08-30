import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Plus, KeyRound, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Panel, PortalHeading, fmtDate, usePortal } from "@/lib/portal";
import { createStaff, listStaff, removeStaff, resetStaffPassword, updateStaffRole } from "@/lib/staff.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/portal/staff")({ component: StaffPage });

const ROLES = ["admin", "accountant", "typist"] as const;
type Role = (typeof ROLES)[number];

const empty = { email: "", password: "", full_name: "", job_title: "", role: "typist" as Role };

function StaffPage() {
  const { session } = usePortal();
  const qc = useQueryClient();
  const fetchStaff = useServerFn(listStaff);
  const addStaff = useServerFn(createStaff);
  const changeRole = useServerFn(updateStaffRole);
  const deleteStaff = useServerFn(removeStaff);
  const resetPassword = useServerFn(resetStaffPassword);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ...empty });

  const { data: staff = [], isLoading } = useQuery({
    queryKey: ["portal", "staff"],
    queryFn: () => fetchStaff(),
  });

  const create = useMutation({
    mutationFn: () =>
      addStaff({
        data: {
          email: form.email,
          password: form.password,
          full_name: form.full_name,
          job_title: form.job_title,
          role: form.role,
        },
      }),
    onSuccess: () => {
      toast.success("Staff account created");
      setOpen(false);
      setForm({ ...empty });
      void qc.invalidateQueries({ queryKey: ["portal", "staff"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const roleMutation = useMutation({
    mutationFn: (vars: { user_id: string; role: Role }) => changeRole({ data: vars }),
    onSuccess: () => {
      toast.success("Role updated");
      void qc.invalidateQueries({ queryKey: ["portal", "staff"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: (user_id: string) => deleteStaff({ data: { user_id } }),
    onSuccess: () => {
      toast.success("Staff account removed");
      void qc.invalidateQueries({ queryKey: ["portal", "staff"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const reset = useMutation({
    mutationFn: (vars: { user_id: string; password: string }) => resetPassword({ data: vars }),
    onSuccess: () => toast.success("Password updated"),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <PortalHeading
        title="Staff & Roles"
        subtitle="Create portal accounts, switch roles, reset passwords or remove access."
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> New staff account
          </Button>
        }
      />

      <Panel className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Position</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Last sign-in</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {staff.map((s) => (
              <tr key={s.id}>
                <td className="px-4 py-3 font-medium">{s.full_name || "—"}</td>
                <td className="px-4 py-3">{s.email}</td>
                <td className="px-4 py-3 text-muted-foreground">{s.job_title ?? "—"}</td>
                <td className="px-4 py-3">
                  <select
                    className="h-8 rounded-md border border-input bg-background px-2 text-xs capitalize"
                    value={s.role ?? ""}
                    onChange={(e) =>
                      roleMutation.mutate({ user_id: s.id, role: e.target.value as Role })
                    }
                  >
                    <option value="" disabled>
                      no role
                    </option>
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{fmtDate(s.last_sign_in_at)}</td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const pw = prompt(`New password for ${s.email} (min 8 characters)`);
                        if (pw && pw.length >= 8) reset.mutate({ user_id: s.id, password: pw });
                        else if (pw) toast.error("Password must be at least 8 characters");
                      }}
                    >
                      <KeyRound className="h-3.5 w-3.5" />
                    </Button>
                    {s.id !== session?.user.id ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (confirm(`Permanently remove ${s.email}?`)) del.mutate(s.id);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
            {!isLoading && staff.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                  No staff accounts found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </Panel>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New staff account</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="sfname">Full name *</Label>
              <Input
                id="sfname"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="semail">Work email *</Label>
              <Input
                id="semail"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="spw">Temporary password *</Label>
              <Input id="spw" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sjob">Position</Label>
              <Input
                id="sjob"
                value={form.job_title}
                onChange={(e) => setForm({ ...form, job_title: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="srole">Role</Label>
              <select
                id="srole"
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm capitalize"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={
                !form.email || form.password.length < 8 || !form.full_name || create.isPending
              }
              onClick={() => create.mutate()}
            >
              Create account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
