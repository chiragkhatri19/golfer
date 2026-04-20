import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { supabase } from "@/integrations/supabase/client";

type Charity = { id: string; name: string; description: string; image_url: string | null; featured: boolean };

const Charities = () => {
  const [charities, setCharities] = useState<Charity[]>([]);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "featured">("all");

  useEffect(() => {
    document.title = "Charities — golfer";
    supabase.from("charities").select("*").order("featured", { ascending: false }).order("name")
      .then(({ data }) => setCharities((data || []) as Charity[]));
  }, []);

  const list = useMemo(() => charities.filter(c => {
    if (filter === "featured" && !c.featured) return false;
    if (q && !(`${c.name} ${c.description}`.toLowerCase().includes(q.toLowerCase()))) return false;
    return true;
  }), [charities, q, filter]);

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <div className="container-narrow py-16">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Directory</p>
          <h1 className="mt-2 max-w-3xl font-display text-5xl leading-tight md:text-6xl">Causes our members carry forward.</h1>
        </motion.div>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search charities" className="pl-10" />
          </div>
          <div className="flex gap-2">
            {(["all", "featured"] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`rounded-sm border px-4 py-2 text-xs uppercase tracking-[0.18em] transition ${filter === f ? "border-accent bg-accent text-accent-foreground" : "border-border hover:border-foreground/40"}`}>
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {list.map((c, i) => (
            <motion.div key={c.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <Link to={`/charities/${c.id}`} className="group block h-full rounded-sm border border-border bg-card p-7 shadow-quiet transition-all hover:border-accent hover:shadow-lift">
                {c.featured && <span className="mb-4 inline-block rounded-full bg-accent-soft px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-accent">Featured</span>}
                <h3 className="font-display text-2xl leading-tight">{c.name}</h3>
                <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{c.description}</p>
                <p className="mt-6 text-xs uppercase tracking-[0.22em] text-accent opacity-0 transition-opacity group-hover:opacity-100">Read more →</p>
              </Link>
            </motion.div>
          ))}
          {list.length === 0 && <p className="col-span-full py-12 text-center text-sm text-muted-foreground">No charities match your search.</p>}
        </div>
      </div>
      <SiteFooter />
    </div>
  );
};
export default Charities;
