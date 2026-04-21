import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Save, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { simulate, type SimResult } from "@/lib/draw";

type Draw = { id: string; month: string; status: string; logic_type: string; winning_numbers: number[] | null; prize_pool: number | null; created_at: string };

const AdminDraws = () => {
  const [draws, setDraws] = useState<Draw[]>([]);
  const [logic, setLogic] = useState<"random" | "algorithmic">("random");
  const [month, setMonth] = useState(format(new Date(), "yyyy-MM"));
  const [sim, setSim] = useState<SimResult | null>(null);
  const [running, setRunning] = useState(false);

  const refresh = () => supabase.from("draws").select("*").order("created_at", { ascending: false })
    .then(({ data }) => setDraws((data || []) as Draw[]));

  useEffect(() => { document.title = "Admin · Draws — golfer"; refresh(); }, []);

  const lastUnclaimedRollover = async (): Promise<number> => {
    // Sum 5-match pots from published draws with no 5-match winner.
    const { data: published } = await supabase.from("draws").select("id,prize_pool").eq("status", "published");
    let rollover = 0;
    for (const d of (published || [])) {
      const { data: w5 } = await supabase.from("winners").select("id").eq("draw_id", d.id).eq("tier", 5);
      if ((w5 || []).length === 0) rollover += Number(d.prize_pool || 0) * 0.4;
    }
    return rollover;
  };

  const runSim = async () => {
    setRunning(true);
    const rollover = await lastUnclaimedRollover();
    const result = await simulate(logic, rollover);
    setSim(result);
    setRunning(false);
  };

  const saveSimulation = async () => {
    if (!sim) return;
    const { data: draw, error } = await supabase.from("draws").insert({
      month, status: "simulated", logic_type: logic, winning_numbers: sim.winning, prize_pool: sim.pool,
    }).select().single();
    if (error || !draw) return toast.error(error?.message || "Failed");
    // Persist entries
    if (sim.entries.length) {
      await supabase.from("draw_entries").insert(sim.entries.map(e => ({
        draw_id: draw.id, user_id: e.user_id, matched_numbers: e.matched, match_count: e.matched.length, prize_tier: e.tier,
      })));
    }
    toast.success("Simulation saved");
    refresh();
  };

  const publish = async (drawId: string) => {
    const { data: draw } = await supabase.from("draws").select("*").eq("id", drawId).single();
    if (!draw) return;
    const { data: entries } = await supabase.from("draw_entries").select("*").eq("draw_id", drawId);
    const pool = Number(draw.prize_pool || 0);
    // Compute winners by tier and write to winners table.
    const tiers = { 3: [] as string[], 4: [] as string[], 5: [] as string[] };
    for (const e of (entries || [])) if (e.prize_tier && e.prize_tier >= 3) tiers[e.prize_tier as 3 | 4 | 5].push(e.user_id);
    const winnerRows: any[] = [];
    for (const t of [3, 4, 5] as const) {
      const share = { 3: 0.25, 4: 0.35, 5: 0.4 }[t];
      const pot = pool * share;
      if (tiers[t].length === 0) continue;
      const per = pot / tiers[t].length;
      for (const uid of tiers[t]) winnerRows.push({ draw_id: drawId, user_id: uid, tier: t, prize_amount: per, status: "pending" });
    }
    if (winnerRows.length) await supabase.from("winners").insert(winnerRows);
    await supabase.from("draws").update({ status: "published" }).eq("id", drawId);
    toast.success("Draw published");
    refresh();
  };

  return (
    <div>
      <h1 className="font-display text-4xl">Draws</h1>
      <p className="mt-2 text-sm text-muted-foreground">Configure logic, simulate, then publish.</p>

      <div className="mt-8 rounded-sm border border-border bg-card p-6 shadow-quiet">
        <div className="grid gap-4 md:grid-cols-3">
          <div><Label>Month</Label><input type="month" value={month} onChange={e => setMonth(e.target.value)} className="mt-2 h-10 w-full rounded-sm border border-input bg-background px-3 text-sm" /></div>
          <div>
            <Label>Logic</Label>
            <Select value={logic} onValueChange={(v: any) => setLogic(v)}>
              <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="random">Random</SelectItem>
                <SelectItem value="algorithmic">Algorithmic (weighted)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end gap-2">
            <Button onClick={runSim} disabled={running} className="w-full"><Play className="mr-2 h-4 w-4" /> {running ? "Simulating…" : "Simulate"}</Button>
          </div>
        </div>

        <AnimatePresence>
          {sim && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-8 border-t border-border pt-6">
              <div className="flex flex-wrap items-baseline justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Winning numbers</p>
                  <div className="mt-3 flex gap-2">
                    {sim.winning.map(n => (
                      <span key={n} className="flex h-12 w-12 items-center justify-center rounded-full border border-accent bg-accent-soft font-display text-xl text-foreground">{n}</span>
                    ))}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Pool</p>
                  <p className="font-display text-3xl">₹${sim.pool.toFixed(2)}</p>
                  {sim.rolloverIn > 0 && <p className="text-xs text-muted-foreground">incl. ₹${sim.rolloverIn.toFixed(2)} rollover</p>}
                </div>
              </div>
              <div className="mt-6 grid gap-3 md:grid-cols-3">
                {([5, 4, 3] as const).map(t => (
                  <div key={t} className="rounded-sm border border-border p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-accent">{t}-match</p>
                    <p className="mt-2 font-display text-2xl">₹${sim.tiers[t].pot.toFixed(2)}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{sim.tiers[t].winners.length} winner{sim.tiers[t].winners.length === 1 ? "" : "s"} · ₹${sim.tiers[t].perWinner.toFixed(2)} ea</p>
                  </div>
                ))}
              </div>
              {sim.jackpotRolloverOut > 0 && <p className="mt-4 text-xs text-muted-foreground">No 5-match — ₹${sim.jackpotRolloverOut.toFixed(2)} will roll over.</p>}
              <Button onClick={saveSimulation} variant="outline" className="mt-6"><Save className="mr-2 h-4 w-4" /> Save simulation</Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <h2 className="mt-12 font-display text-2xl">History</h2>
      <div className="mt-4 space-y-3">
        {draws.map(d => (
          <div key={d.id} className="flex items-center justify-between gap-4 rounded-sm border border-border bg-card p-5">
            <div>
              <p className="font-display text-lg">{d.month}</p>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{d.logic_type} · {d.status}</p>
              {d.winning_numbers && <p className="mt-2 font-mono text-sm">{d.winning_numbers.join(" · ")}</p>}
            </div>
            <div className="text-right">
              <p className="font-display text-xl">₹${Number(d.prize_pool || 0).toFixed(2)}</p>
              {d.status !== "published" && <Button size="sm" className="mt-2" onClick={() => publish(d.id)}><CheckCircle2 className="mr-2 h-3 w-3" /> Publish</Button>}
            </div>
          </div>
        ))}
        {draws.length === 0 && <p className="rounded-sm border border-dashed border-border p-10 text-center text-sm text-muted-foreground">No draws yet.</p>}
      </div>
    </div>
  );
};
export default AdminDraws;
