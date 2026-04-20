import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

type Profile = {
  user_id: string; email: string | null; name: string | null;
  subscription_status: string; subscription_plan: string | null;
  charity_pct: number; created_at: string;
};

const AdminUsers = () => {
  const [users, setUsers] = useState<Profile[]>([]);

  const refresh = () => supabase.from("profiles").select("*").order("created_at", { ascending: false })
    .then(({ data }) => setUsers((data || []) as Profile[]));

  useEffect(() => { document.title = "Admin · Users — golfer"; refresh(); }, []);

  const setStatus = async (user_id: string, subscription_status: string) => {
    const { error } = await supabase.from("profiles").update({ subscription_status }).eq("user_id", user_id);
    if (error) return toast.error(error.message);
    toast.success("Status updated");
    refresh();
  };

  return (
    <div>
      <h1 className="font-display text-4xl">Users</h1>
      <p className="mt-2 text-sm text-muted-foreground">{users.length} member{users.length === 1 ? "" : "s"}.</p>
      <div className="mt-8 overflow-hidden rounded-sm border border-border bg-card">
        <div className="grid grid-cols-12 gap-4 border-b border-border bg-secondary/50 px-5 py-3 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          <div className="col-span-4">Member</div>
          <div className="col-span-2">Plan</div>
          <div className="col-span-2">Charity %</div>
          <div className="col-span-2">Joined</div>
          <div className="col-span-2">Status</div>
        </div>
        {users.map(u => (
          <div key={u.user_id} className="grid grid-cols-12 items-center gap-4 border-b border-border px-5 py-4 text-sm last:border-b-0">
            <div className="col-span-4">
              <p className="font-medium">{u.name || "—"}</p>
              <p className="text-xs text-muted-foreground">{u.email}</p>
            </div>
            <div className="col-span-2 capitalize">{u.subscription_plan || "—"}</div>
            <div className="col-span-2 font-display">{u.charity_pct}%</div>
            <div className="col-span-2 text-xs text-muted-foreground">{format(new Date(u.created_at), "PP")}</div>
            <div className="col-span-2">
              <Select value={u.subscription_status} onValueChange={v => setStatus(u.user_id, v)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="pending_payment">Pending</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="lapsed">Lapsed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        ))}
        {users.length === 0 && <div className="p-10 text-center text-sm text-muted-foreground">No members yet.</div>}
      </div>
    </div>
  );
};
export default AdminUsers;
