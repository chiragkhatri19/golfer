import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Pencil, Trash2, Plus, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";

type Profile = {
  user_id: string; email: string | null; name: string | null;
  subscription_status: string; subscription_plan: string | null;
  charity_pct: number; created_at: string; renewal_date: string | null;
};
type Score = { id: string; score: number; date: string; user_id: string };

const AdminUsers = () => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [scoreUser, setScoreUser] = useState<Profile | null>(null);
  const [scores, setScores] = useState<Score[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editScore, setEditScore] = useState("");
  const [editDate, setEditDate] = useState("");
  const [newScore, setNewScore] = useState("");
  const [newDate, setNewDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const refresh = () => supabase.from("profiles").select("*").order("created_at", { ascending: false })
    .then(({ data }) => setUsers((data || []) as Profile[]));

  useEffect(() => { document.title = "Admin · Users — golfer"; refresh(); }, []);

  const setStatus = async (user_id: string, subscription_status: string) => {
    const update: any = { subscription_status };
    if (subscription_status === "active") {
      update.renewal_date = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    }
    const { error } = await supabase.from("profiles").update(update).eq("user_id", user_id);
    if (error) return toast.error(error.message);
    toast.success(subscription_status === "active" ? "Subscription activated" : "Status updated");
    refresh();
  };

  const setPlan = async (user_id: string, subscription_plan: string) => {
    const { error } = await supabase.from("profiles").update({ subscription_plan }).eq("user_id", user_id);
    if (error) return toast.error(error.message);
    toast.success("Plan updated"); refresh();
  };

  const loadScores = async (u: Profile) => {
    setScoreUser(u);
    const { data } = await supabase.from("scores").select("*").eq("user_id", u.user_id).order("date", { ascending: false });
    setScores((data || []) as Score[]);
  };

  const addScore = async () => {
    if (!scoreUser) return;
    const n = parseInt(newScore, 10);
    if (isNaN(n) || n < 1 || n > 45) return toast.error("Score must be 1–45.");
    if (scores.some(s => s.date === newDate)) return toast.error("Score for that date already exists.");
    const { error } = await supabase.from("scores").insert({ user_id: scoreUser.user_id, score: n, date: newDate });
    if (error) return toast.error(error.message);
    setNewScore(""); toast.success("Score added.");
    loadScores(scoreUser);
  };

  const saveEdit = async (id: string) => {
    const n = parseInt(editScore, 10);
    if (isNaN(n) || n < 1 || n > 45) return toast.error("Score must be 1–45.");
    const { error } = await supabase.from("scores").update({ score: n, date: editDate }).eq("id", id);
    if (error) return toast.error(error.message);
    setEditingId(null); toast.success("Updated.");
    if (scoreUser) loadScores(scoreUser);
  };

  const delScore = async (id: string) => {
    const { error } = await supabase.from("scores").delete().eq("id", id);
    if (error) return toast.error(error.message);
    if (scoreUser) loadScores(scoreUser);
  };

  return (
    <div>
      <h1 className="font-display text-4xl">Users</h1>
      <p className="mt-2 text-sm text-muted-foreground">{users.length} member{users.length === 1 ? "" : "s"}.</p>
      <div className="mt-8 overflow-hidden rounded-sm border border-border bg-card">
        <div className="grid grid-cols-12 gap-3 border-b border-border bg-secondary/50 px-5 py-3 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          <div className="col-span-3">Member</div>
          <div className="col-span-2">Plan</div>
          <div className="col-span-1">Charity %</div>
          <div className="col-span-2">Joined</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>
        {users.map(u => (
          <div key={u.user_id} className="grid grid-cols-12 items-center gap-3 border-b border-border px-5 py-4 text-sm last:border-b-0">
            <div className="col-span-3">
              <p className="font-medium">{u.name || "—"}</p>
              <p className="text-xs text-muted-foreground">{u.email}</p>
            </div>
            <div className="col-span-2">
              <Select value={u.subscription_plan || ""} onValueChange={v => setPlan(u.user_id, v)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-1 font-display">{u.charity_pct}%</div>
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
            <div className="col-span-2 flex justify-end gap-1">
              {u.subscription_status !== "active" && (
                <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setStatus(u.user_id, "active")}>
                  <CheckCircle className="mr-1 h-3 w-3" /> Activate
                </Button>
              )}
              <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => loadScores(u)}>Scores</Button>
            </div>
          </div>
        ))}
        {users.length === 0 && <div className="p-10 text-center text-sm text-muted-foreground">No members yet.</div>}
      </div>

      <Dialog open={!!scoreUser} onOpenChange={o => !o && setScoreUser(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Scores · {scoreUser?.name || scoreUser?.email}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-3 rounded-sm border border-border bg-secondary/30 p-4">
            <div><Label className="text-[10px] uppercase tracking-[0.18em]">Score</Label>
              <Input type="number" min={1} max={45} value={newScore} onChange={e => setNewScore(e.target.value)} placeholder="1–45" /></div>
            <div><Label className="text-[10px] uppercase tracking-[0.18em]">Date</Label>
              <Input type="date" value={newDate} max={format(new Date(), "yyyy-MM-dd")} onChange={e => setNewDate(e.target.value)} /></div>
            <div className="flex items-end"><Button onClick={addScore} className="w-full"><Plus className="mr-1 h-3 w-3" /> Add</Button></div>
          </div>
          <div className="overflow-hidden rounded-sm border border-border">
            {scores.length === 0 && <p className="p-8 text-center text-sm text-muted-foreground">No scores.</p>}
            {scores.map(s => (
              <div key={s.id} className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 last:border-b-0">
                {editingId === s.id ? (
                  <>
                    <Input type="number" min={1} max={45} value={editScore} onChange={e => setEditScore(e.target.value)} className="w-20" />
                    <Input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} className="w-44" />
                    <div className="flex gap-1 ml-auto">
                      <Button size="sm" variant="outline" onClick={() => saveEdit(s.id)}>Save</Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="font-display text-2xl w-12">{s.score}</p>
                    <p className="text-xs text-muted-foreground flex-1">{format(new Date(s.date), "PP")}</p>
                    <Button size="icon" variant="ghost" onClick={() => { setEditingId(s.id); setEditScore(String(s.score)); setEditDate(s.date); }}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => delScore(s.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </>
                )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
export default AdminUsers;
