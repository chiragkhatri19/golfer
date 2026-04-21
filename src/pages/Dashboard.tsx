import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Plus, Trash2, Heart, Calendar as CalendarIcon, Trophy, Upload, CheckCircle2, Pencil, Save, X, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SiteNav } from "@/components/SiteNav";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { PLAN_PRICES } from "@/lib/roles";

type Profile = {
  user_id: string; name: string | null; email: string | null;
  charity_id: string | null; charity_pct: number;
  subscription_status: string; subscription_plan: string | null; renewal_date: string | null;
};
type Score = { id: string; score: number; date: string };
type Charity = { id: string; name: string };
type Winner = { id: string; tier: number; prize_amount: number; status: string; proof_url: string | null; draw_id: string };

const Dashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [scores, setScores] = useState<Score[]>([]);
  const [charities, setCharities] = useState<Charity[]>([]);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [drawsEntered, setDrawsEntered] = useState(0);
  const [newScore, setNewScore] = useState("");
  const [newDate, setNewDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editScore, setEditScore] = useState("");
  const [editDate, setEditDate] = useState("");
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => { document.title = "Dashboard — golfer"; }, []);

  const refresh = async () => {
    if (!user) return;
    const [p, s, c, w, e] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("scores").select("*").eq("user_id", user.id).order("date", { ascending: false }),
      supabase.from("charities").select("id,name").order("name"),
      supabase.from("winners").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("draw_entries").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    ]);
    setProfile(p.data as Profile);
    setScores((s.data || []) as Score[]);
    setCharities((c.data || []) as Charity[]);
    setWinners((w.data || []) as Winner[]);
    setDrawsEntered((e as any).count || 0);
  };
  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [user]);

  const subActive = profile?.subscription_status === "active";

  const addScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!subActive) return toast.error("Activate your subscription to log scores.");
    const n = parseInt(newScore, 10);
    if (isNaN(n) || n < 1 || n > 45) return toast.error("Score must be between 1 and 45.");
    if (scores.some(s => s.date === newDate)) return toast.error("You already have a score for that date — edit it instead.");
    const { error } = await supabase.from("scores").insert({ user_id: user.id, score: n, date: newDate });
    if (error) return toast.error(error.message);
    setNewScore(""); toast.success("Score added."); refresh();
  };

  const deleteScore = async (id: string) => {
    const { error } = await supabase.from("scores").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Score deleted."); refresh();
  };

  const startEdit = (s: Score) => { setEditingId(s.id); setEditScore(String(s.score)); setEditDate(s.date); };
  const cancelEdit = () => { setEditingId(null); };
  const saveEdit = async (id: string) => {
    const n = parseInt(editScore, 10);
    if (isNaN(n) || n < 1 || n > 45) return toast.error("Score must be between 1 and 45.");
    if (scores.some(s => s.id !== id && s.date === editDate)) return toast.error("Another score exists for that date.");
    const { error } = await supabase.from("scores").update({ score: n, date: editDate }).eq("id", id);
    if (error) return toast.error(error.message);
    setEditingId(null); toast.success("Score updated."); refresh();
  };

  const updateCharity = async (charity_id: string) => {
    if (!user) return;
    await supabase.from("profiles").update({ charity_id }).eq("user_id", user.id);
    toast.success("Charity updated."); refresh();
  };

  const updatePct = (pct: number) => profile && setProfile({ ...profile, charity_pct: pct });
  const commitPct = async () => {
    if (!user || !profile) return;
    await supabase.from("profiles").update({ charity_pct: profile.charity_pct }).eq("user_id", user.id);
    toast.success("Contribution updated.");
  };

  const uploadProof = async (winner: Winner, file: File) => {
    if (!user) return;
    const path = `${user.id}/${winner.id}-${file.name}`;
    const { error: upErr } = await supabase.storage.from("winner-proofs").upload(path, file, { upsert: true });
    if (upErr) return toast.error(upErr.message);
    const { error } = await supabase.from("winners").update({ proof_url: path }).eq("id", winner.id);
    if (error) return toast.error(error.message);
    toast.success("Proof uploaded — awaiting verification."); refresh();
  };

  const planPrice = profile?.subscription_plan ? (PLAN_PRICES[profile.subscription_plan] ?? 0) : 0;
  const contribution = (planPrice * (profile?.charity_pct ?? 10)) / 100;
  const totalWon = winners.reduce((s, w) => s + Number(w.prize_amount), 0);
  const pending = winners.filter(w => w.status !== "paid").reduce((s, w) => s + Number(w.prize_amount), 0);

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <div className="container-narrow py-12">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Members area</p>
          <h1 className="mt-2 font-display text-5xl leading-tight">
            Hello, <span className="text-accent">{profile?.name || "member"}</span>.
          </h1>
        </motion.div>

        {!subActive && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="mb-10 flex items-start gap-4 rounded-sm border border-accent/40 bg-accent-soft/30 p-5">
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            <div className="flex-1">
              <p className="text-sm font-medium">Your subscription isn't active yet.</p>
              <p className="mt-1 text-xs text-muted-foreground">Score entry and draw participation unlock once payment completes. An admin can activate manually for demo purposes.</p>
            </div>
          </motion.div>
        )}

        <div className="grid gap-6 md:grid-cols-3">
          <Card title="Subscription">
            <div className="flex items-baseline justify-between">
              <p className="font-display text-3xl capitalize">{profile?.subscription_plan || "—"}</p>
              <span className={`rounded-full px-3 py-1 text-xs uppercase tracking-wider ${subActive ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"}`}>
                {profile?.subscription_status?.replace("_", " ") || "inactive"}
              </span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              {planPrice ? `£${planPrice.toFixed(2)} ${profile?.subscription_plan === "yearly" ? "/ year" : "/ month"}` : ""}
              {profile?.renewal_date && ` · renews ${format(new Date(profile.renewal_date), "PP")}`}
            </p>
          </Card>

          <Card title="Your charity">
            <Heart className="absolute right-6 top-6 h-4 w-4 text-accent" />
            <Select value={profile?.charity_id || ""} onValueChange={updateCharity}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Choose a charity" /></SelectTrigger>
              <SelectContent>
                {charities.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="mt-6">
              <div className="mb-3 flex items-baseline justify-between">
                <Label>Contribution</Label>
                <span className="font-display text-2xl">{profile?.charity_pct ?? 10}%</span>
              </div>
              <Slider min={10} max={100} step={5} value={[profile?.charity_pct ?? 10]} onValueChange={v => updatePct(v[0])} onValueCommit={commitPct} />
              <p className="mt-3 text-xs text-muted-foreground">
                {planPrice
                  ? <>≈ <span className="text-foreground font-display">£{contribution.toFixed(2)}</span> per {profile?.subscription_plan === "yearly" ? "year" : "month"} to charity.</>
                  : "Activate a plan to see your contribution."}
              </p>
              {profile?.charity_id && (
                <Button asChild variant="ghost" size="sm" className="mt-3 w-full">
                  <Link to={`/charities/${profile.charity_id}`}>View charity →</Link>
                </Button>
              )}
            </div>
          </Card>

          <Card title="Participation">
            <div className="grid grid-cols-2 gap-6">
              <Stat label="Scores logged" value={`${scores.length}/5`} />
              <Stat label="Draws entered" value={String(drawsEntered)} />
            </div>
            <div className="mt-6 flex items-center gap-3 rounded-sm border border-border bg-background/50 p-4 text-sm">
              <CalendarIcon className="h-4 w-4 text-accent" />
              <span className="text-muted-foreground">Next draw</span>
              <span className="ml-auto font-display">{format(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1), "PP")}</span>
            </div>
          </Card>
        </div>

        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-12 grid gap-6 md:grid-cols-12">
          <div className="md:col-span-5">
            <h2 className="font-display text-2xl">Log a score</h2>
            <p className="mt-2 text-sm text-muted-foreground">Stableford 1–45. One per date. New scores replace the oldest of five.</p>
            <form onSubmit={addScore} className="mt-6 space-y-4 rounded-sm border border-border bg-card p-6 shadow-quiet">
              <div className="space-y-2"><Label>Date</Label>
                <Input type="date" value={newDate} max={format(new Date(), "yyyy-MM-dd")} onChange={e => setNewDate(e.target.value)} disabled={!subActive} />
              </div>
              <div className="space-y-2"><Label>Score</Label>
                <Input type="number" min={1} max={45} value={newScore} onChange={e => setNewScore(e.target.value)} placeholder="e.g. 32" disabled={!subActive} />
              </div>
              <Button type="submit" className="w-full" disabled={!subActive}>
                {subActive ? <><Plus className="mr-2 h-4 w-4" /> Add score</> : <><Lock className="mr-2 h-4 w-4" /> Subscription required</>}
              </Button>
            </form>
          </div>

          <div className="md:col-span-7">
            <h2 className="font-display text-2xl">Latest five</h2>
            <div className="mt-6 overflow-hidden rounded-sm border border-border bg-card">
              {scores.length === 0 && <div className="p-10 text-center text-sm text-muted-foreground">No scores yet. Add one to enter the next draw.</div>}
              {scores.map((s, i) => (
                <motion.div key={s.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                  className="flex items-center justify-between border-b border-border px-6 py-5 last:border-b-0">
                  {editingId === s.id ? (
                    <>
                      <div className="flex flex-1 items-center gap-3">
                        <Input type="number" min={1} max={45} value={editScore} onChange={e => setEditScore(e.target.value)} className="w-20" />
                        <Input type="date" max={format(new Date(), "yyyy-MM-dd")} value={editDate} onChange={e => setEditDate(e.target.value)} className="w-44" />
                      </div>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => saveEdit(s.id)} aria-label="Save"><Save className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={cancelEdit} aria-label="Cancel"><X className="h-4 w-4" /></Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <p className="font-display text-3xl">{s.score}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">{format(new Date(s.date), "PP")}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => startEdit(s)} aria-label="Edit"><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteScore(s.id)} aria-label="Delete"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mt-12">
          <h2 className="font-display text-2xl">Winnings</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            <Card title="Total won"><p className="font-display text-4xl">£{totalWon.toFixed(2)}</p></Card>
            <Card title="Pending payout"><p className="font-display text-4xl">£{pending.toFixed(2)}</p></Card>
            <Card title="Lifetime"><div className="flex items-center gap-3"><Trophy className="h-5 w-5 text-accent" /><p className="font-display text-xl">{winners.length} win{winners.length === 1 ? "" : "s"}</p></div></Card>
          </div>

          {winners.length > 0 && (
            <div className="mt-8 overflow-hidden rounded-sm border border-border bg-card">
              {winners.map(w => (
                <div key={w.id} className="grid grid-cols-12 items-center gap-4 border-b border-border px-6 py-5 last:border-b-0">
                  <div className="col-span-3"><p className="font-display text-2xl">{w.tier}-match</p></div>
                  <div className="col-span-3"><p className="font-display text-xl">£{Number(w.prize_amount).toFixed(2)}</p></div>
                  <div className="col-span-3">
                    <span className={`rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.18em] ${
                      w.status === "paid" ? "bg-accent text-accent-foreground" :
                      w.status === "verified" ? "bg-accent-soft text-accent" :
                      w.status === "rejected" ? "bg-destructive/10 text-destructive" :
                      "bg-muted text-muted-foreground"
                    }`}>{w.status}</span>
                  </div>
                  <div className="col-span-3 flex justify-end">
                    {w.proof_url ? (
                      <span className="inline-flex items-center gap-1 text-xs text-accent"><CheckCircle2 className="h-3 w-3" /> Proof submitted</span>
                    ) : (
                      <>
                        <input ref={el => fileInputs.current[w.id] = el} type="file" accept="image/*" hidden
                          onChange={e => e.target.files?.[0] && uploadProof(w, e.target.files[0])} />
                        <Button size="sm" variant="outline" onClick={() => fileInputs.current[w.id]?.click()}>
                          <Upload className="mr-2 h-3 w-3" /> Upload proof
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.section>
      </div>
    </div>
  );
};

const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="relative rounded-sm border border-border bg-card p-6 shadow-quiet">
    <p className="mb-4 text-xs uppercase tracking-[0.22em] text-muted-foreground">{title}</p>
    {children}
  </motion.div>
);
const Stat = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
    <p className="mt-1 font-display text-3xl">{value}</p>
  </div>
);

export default Dashboard;
