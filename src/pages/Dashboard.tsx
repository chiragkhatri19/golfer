import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Plus, Trash2, Heart, Calendar as CalendarIcon, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SiteNav } from "@/components/SiteNav";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

type Profile = {
  user_id: string; name: string | null; email: string | null;
  charity_id: string | null; charity_pct: number;
  subscription_status: string; subscription_plan: string | null; renewal_date: string | null;
};
type Score = { id: string; score: number; date: string };
type Charity = { id: string; name: string };

const Dashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [scores, setScores] = useState<Score[]>([]);
  const [charities, setCharities] = useState<Charity[]>([]);
  const [newScore, setNewScore] = useState("");
  const [newDate, setNewDate] = useState(format(new Date(), "yyyy-MM-dd"));

  useEffect(() => { document.title = "Dashboard — golfer"; }, []);

  const refresh = async () => {
    if (!user) return;
    const [p, s, c] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("scores").select("*").eq("user_id", user.id).order("date", { ascending: false }),
      supabase.from("charities").select("id,name").order("name"),
    ]);
    setProfile(p.data as Profile);
    setScores((s.data || []) as Score[]);
    setCharities((c.data || []) as Charity[]);
  };
  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [user]);

  const addScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const n = parseInt(newScore, 10);
    if (isNaN(n) || n < 1 || n > 45) return toast.error("Score must be between 1 and 45.");
    if (scores.some(s => s.date === newDate)) return toast.error("You already have a score for that date.");
    const { error } = await supabase.from("scores").insert({ user_id: user.id, score: n, date: newDate });
    if (error) return toast.error(error.message);
    setNewScore("");
    toast.success("Score added.");
    refresh();
  };

  const deleteScore = async (id: string) => {
    const { error } = await supabase.from("scores").delete().eq("id", id);
    if (error) return toast.error(error.message);
    refresh();
  };

  const updateCharity = async (charity_id: string) => {
    if (!user) return;
    await supabase.from("profiles").update({ charity_id }).eq("user_id", user.id);
    toast.success("Charity updated.");
    refresh();
  };

  const updatePct = async (pct: number) => {
    if (!user || !profile) return;
    setProfile({ ...profile, charity_pct: pct });
  };
  const commitPct = async () => {
    if (!user || !profile) return;
    await supabase.from("profiles").update({ charity_pct: profile.charity_pct }).eq("user_id", user.id);
    toast.success("Contribution updated.");
  };

  const subActive = profile?.subscription_status === "active";

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

        <div className="grid gap-6 md:grid-cols-3">
          {/* Subscription */}
          <Card title="Subscription">
            <div className="flex items-baseline justify-between">
              <p className="font-display text-3xl capitalize">{profile?.subscription_plan || "—"}</p>
              <span className={`rounded-full px-3 py-1 text-xs uppercase tracking-wider ${subActive ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"}`}>
                {profile?.subscription_status?.replace("_", " ") || "inactive"}
              </span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              {profile?.renewal_date ? `Renews ${format(new Date(profile.renewal_date), "PP")}` : "No active renewal scheduled."}
            </p>
            {!subActive && (
              <Button className="mt-5 w-full" disabled>Complete checkout (Stripe pending)</Button>
            )}
          </Card>

          {/* Charity */}
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
              <Slider min={10} max={100} step={5}
                value={[profile?.charity_pct ?? 10]}
                onValueChange={v => updatePct(v[0])}
                onValueCommit={commitPct} />
              <p className="mt-2 text-xs text-muted-foreground">Minimum 10%. Adjust upward any time.</p>
            </div>
          </Card>

          {/* Participation */}
          <Card title="Participation">
            <div className="grid grid-cols-2 gap-6">
              <Stat label="Scores logged" value={`${scores.length}/5`} />
              <Stat label="Draws entered" value="0" />
            </div>
            <div className="mt-6 flex items-center gap-3 rounded-sm border border-border bg-background/50 p-4 text-sm">
              <CalendarIcon className="h-4 w-4 text-accent" />
              <span className="text-muted-foreground">Next draw</span>
              <span className="ml-auto font-display">{format(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1), "PP")}</span>
            </div>
          </Card>
        </div>

        {/* Scores section */}
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="mt-12 grid gap-6 md:grid-cols-12">
          <div className="md:col-span-5">
            <h2 className="font-display text-2xl">Log a score</h2>
            <p className="mt-2 text-sm text-muted-foreground">Stableford 1–45. One per date. New scores replace the oldest of five.</p>
            <form onSubmit={addScore} className="mt-6 space-y-4 rounded-sm border border-border bg-card p-6 shadow-quiet">
              <div className="space-y-2"><Label>Date</Label>
                <Input type="date" value={newDate} max={format(new Date(), "yyyy-MM-dd")} onChange={e => setNewDate(e.target.value)} />
              </div>
              <div className="space-y-2"><Label>Score</Label>
                <Input type="number" min={1} max={45} value={newScore} onChange={e => setNewScore(e.target.value)} placeholder="e.g. 32" />
              </div>
              <Button type="submit" className="w-full"><Plus className="mr-2 h-4 w-4" /> Add score</Button>
            </form>
          </div>

          <div className="md:col-span-7">
            <h2 className="font-display text-2xl">Latest five</h2>
            <div className="mt-6 overflow-hidden rounded-sm border border-border bg-card">
              {scores.length === 0 && (
                <div className="p-10 text-center text-sm text-muted-foreground">No scores yet. Add one to enter the next draw.</div>
              )}
              {scores.map((s, i) => (
                <motion.div key={s.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                  className="flex items-center justify-between border-b border-border px-6 py-5 last:border-b-0">
                  <div>
                    <p className="font-display text-3xl">{s.score}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">{format(new Date(s.date), "PP")}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => deleteScore(s.id)} aria-label="Delete">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Winnings */}
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mt-12">
          <h2 className="font-display text-2xl">Winnings</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            <Card title="Total won"><p className="font-display text-4xl">£0.00</p></Card>
            <Card title="Pending payout"><p className="font-display text-4xl">£0.00</p></Card>
            <Card title="Lifetime tier">
              <div className="flex items-center gap-3"><Trophy className="h-5 w-5 text-accent" /><p className="font-display text-xl">Member</p></div>
            </Card>
          </div>
        </motion.section>
      </div>
    </div>
  );
};

const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
    className="relative rounded-sm border border-border bg-card p-6 shadow-quiet">
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
