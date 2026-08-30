import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import { Plus, KeyRound, Trash2, Pencil, Camera, Loader2, User } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Panel, PortalHeading, fmtDate, usePortal } from "@/lib/portal";
import {
  createStaff,
  listStaff,
  removeStaff,
  resetStaffPassword,
  updateStaffDetails,
  updateStaffRole,
} from "@/lib/staff.functions";
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

type StaffRow = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  job_title: string | null;
  active: boolean;
  role: Role | null;
  last_sign_in_at: string | null;
  avatar_url: string | null;
  avatar_path: string | null;
};

function Avatar({ url, name, size = 40 }: { url: string | null; name: string; size?: number }) {
  const initials = (name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
  return url ? (
    <img
      src={url}
      alt={name}
      style={{ width: size, height: size }}
      className="rounded-full border border-border object-cover"
    />
  ) : (
    <div
      style={{ width: size, height: size }}
      className="flex items-center justify-center rounded-full border border-border bg-muted text-xs font-semibold text-muted-foreground"
    >
      {initials || <User className="h-4 w-4" />}
    </div>
  );
}

function StaffPage() {
  const { session, refresh } = usePortal();
  const qc = useQueryClient();
  const fetchStaff = useServerFn(listStaff);
  const addStaff = useServerFn(createStaff);
  const changeRole = useServerFn(updateStaffRole);
  const deleteStaff = useServerFn(removeStaff);
  const resetPassword = useServerFn(resetStaffPassword);
  const saveDetails = useServerFn(updateStaffDetails);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ...empty });
  const [editing, setEditing] = useState<StaffRow | null>(null);
  const [edit, setEdit] = useState({ full_name: "", job_title: "", phone: "", email: "" });
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement | null>(null);
  const uploadTarget = useRef<string | null>(null);

  const { data: staff = [], isLoading } = useQuery({
    queryKey: ["portal", "staff"],
    queryFn: async () => (await fetchStaff()) as unknown as StaffRow[],
  });

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["portal", "staff"] });
    void refresh();
  };

  const create = useMutation({
    mutationFn: () =>
      addStaff({
        data: {
          email: form.email.trim(),
          password: form.password,
          full_name: form.full_name.trim(),
          job_title: form.job_title,
          role: form.role,
        },
      }),
    onSuccess: () => {
      toast.success("Staff account created");
      setOpen(false);
      setForm({ ...empty });
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const roleMutation = useMutation({
    mutationFn: (vars: { user_id: string; role: Role }) => changeRole({ data: vars }),
    onSuccess: () => {
      toast.success("Access level updated");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: (user_id: string) => deleteStaff({ data: { user_id } }),
    onSuccess: () => {
      toast.success("Staff account removed");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const reset = useMutation({
    mutationFn: (vars: { user_id: string; password: string }) => resetPassword({ data: vars }),
    onSuccess: () => toast.success("Password updated"),
    onError: (e: Error) => toast.error(e.message),
  });

  const details = useMutation({
    mutationFn: (vars: Parameters<typeof saveDetails>[0]["data"]) => saveDetails({ data: vars }),
    onSuccess: () => {
      toast.success("Profile updated");
      setEditing(null);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const pickPhoto = (userId: string) => {
    uploadTarget.current = userId;
    fileInput.current?.click();
  };

  const onFile = async (file: File | undefined) => {
    const userId = uploadTarget.current;
    if (!file || !userId) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file (JPG or PNG).");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Photo must be smaller than 2 MB.");
      return;
    }
    setUploadingFor(userId);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${userId}/avatar-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (error) throw error;
      await details.mutateAsync({ user_id: userId, avatar_path: path });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploadingFor(null);
      uploadTarget.current = null;
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  return (
    <div>
      <PortalHeading
        title="Users & Access"
        subtitle="Create portal users, set their name, position, profile photo, access level and password."
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> New user
          </Button>
        }
      />

      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => void onFile(e.target.files?.[0])}
      />

      <Panel className="overflow-x-auto">
        <table className="w-full min-w-[920px] text-sm">
          <thead className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Photo</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Position</th>
              <th className="px-4 py-3">Access level</th>
              <th className="px-4 py-3">Last sign-in</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {staff.map((s) => (
              <tr key={s.id}>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    className="group relative"
                    title="Upload profile photo"
                    onClick={() => pickPhoto(s.id)}
                  >
                    <Avatar url={s.avatar_url} name={s.full_name} />
                    <span className="absolute -bottom-1 -right-1 rounded-full border border-border bg-background p-1">
                      {uploadingFor === s.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Camera className="h-3 w-3 text-muted-foreground" />
                      )}
                    </span>
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium">{s.full_name || "—"}</div>
                  {s.phone ? <div className="text-xs text-muted-foreground">{s.phone}</div> : null}
                </td>
                <td className="px-4 py-3">{s.email}</td>
                <td className="px-4 py-3 text-muted-foreground">{s.job_title ?? "—"}</td>
                <td className="px-4 py-3">
                  <select
                    className="h-8 rounded-md border border-input bg-background px-2 text-xs capitalize"
                    value={s.role ?? ""}
                    onChange={(e) => roleMutation.mutate({ user_id: s.id, role: e.target.value as Role })}
                  >
                    <option value="" disabled>
                      no access
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
                      title="Edit details"
                      onClick={() => {
                        setEditing(s);
                        setEdit({
                          full_name: s.full_name ?? "",
                          job_title: s.job_title ?? "",
                          phone: s.phone ?? "",
                          email: s.email ?? "",
                        });
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      title="Set a new password"
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
                        title="Remove access"
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
                <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
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
            <DialogTitle>New user</DialogTitle>
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
              <Label htmlFor="semail">Login email *</Label>
              <Input
                id="semail"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="spw">Password * (min 8)</Label>
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
              <Label htmlFor="srole">Access level</Label>
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
            <p className="text-xs text-muted-foreground sm:col-span-2">
              After creating the account, click the photo circle in the table to upload their profile picture.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!form.email || form.password.length < 8 || !form.full_name || create.isPending}
              onClick={() => create.mutate()}
            >
              Create account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit user</DialogTitle>
          </DialogHeader>
          {editing ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-3 sm:col-span-2">
                <Avatar url={editing.avatar_url} name={editing.full_name} size={56} />
                <Button size="sm" variant="outline" onClick={() => pickPhoto(editing.id)}>
                  <Camera className="mr-2 h-3.5 w-3.5" /> Change photo
                </Button>
                {editing.avatar_path ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => details.mutate({ user_id: editing.id, avatar_path: null })}
                  >
                    Remove
                  </Button>
                ) : null}
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="efname">Full name</Label>
                <Input
                  id="efname"
                  value={edit.full_name}
                  onChange={(e) => setEdit({ ...edit, full_name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="eemail">Login email</Label>
                <Input
                  id="eemail"
                  type="email"
                  value={edit.email}
                  onChange={(e) => setEdit({ ...edit, email: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ephone">Phone</Label>
                <Input id="ephone" value={edit.phone} onChange={(e) => setEdit({ ...edit, phone: e.target.value })} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="ejob">Position</Label>
                <Input
                  id="ejob"
                  value={edit.job_title}
                  onChange={(e) => setEdit({ ...edit, job_title: e.target.value })}
                />
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button
              disabled={!edit.full_name || details.isPending}
              onClick={() =>
                editing &&
                details.mutate({
                  user_id: editing.id,
                  full_name: edit.full_name.trim(),
                  job_title: edit.job_title,
                  phone: edit.phone,
                  ...(edit.email && edit.email !== editing.email ? { email: edit.email.trim() } : {}),
                })
              }
            >
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
