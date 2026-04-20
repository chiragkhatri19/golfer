import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { PLAN_PRICES } from "@/lib/roles";

type Stat = { label: string; value: string; sub?: string };

const AdminReports = () => {
  const [stats, setStats] = useState<Stat[]>([]);

  useEffect(() => {
    document.title = "Admin · Reports — golfer";
    (async () => {
      const [{ count: users }, { data: subs }, { count: drawsCount }, { data: winners }, { count: charitiesCount }] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("subscriptions").select("plan,status").eq("status", "active"),
        supabase.from("draws").select("*", { count: "exact", head: true }).eq("status", "published"),
        supabase.from("winners").select("prize_amount,status"),
        supabase.from("charities").select("*", { count: "exact", head: true }),
      ]);
      const monthlyRevenue = (subs || []).reduce((s, x) => s + (PLAN_PRICES[x.plan] || 0), 0);
      const totalPayouts = (winners || []).reduce((s, w) => s + Number(w.prize_amount || 0), 0);
      const charityContribAtMin = monthlyRevenue * 0.1;
      setStats([
        { label: "Total members", value: String(users || 0) },
        { label: "Active subscriptions", value: String((subs || []).length) },
        { label: "Charities listed", value: String(charitiesCount || 0) },
        { label: "Published draws", value: String(drawsCount || 0) },
        { label: "Recurring revenue", value: `£${monthlyRevenue.toFixed(2)}`, sub: "all active plans" },
        { label: "Charity contribution", value: `£${charityContribAtMin.toFixed(2)}`, sub: "at 10% minimum" },
        { label: "Lifetime payouts", value: `£${totalPayouts.toFixed(2)}` },
        { label: "Pending payouts", value: String((winners || []).filter(w => w.status !== "paid").length) },
      ]);
    })();
  }, []);

  return (
    <div>
      <h1 className="font-display text-4xl">Reports</h1>
      <p className="mt-2 text-sm text-muted-foreground">Live snapshot of the platform.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
            className="rounded-sm border border-border bg-card p-6 shadow-quiet">
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">{s.label}</p>
            <p className="mt-3 font-display text-3xl">{s.value}</p>
            {s.sub && <p className="mt-1 text-xs text-muted-foreground">{s.sub}</p>}
          </motion.div>
        ))}
      </div>
    </div>
  );
};
export default AdminReports;
