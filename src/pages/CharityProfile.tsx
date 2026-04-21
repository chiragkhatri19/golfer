import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { DonateDialog } from "@/components/DonateDialog";
import { supabase } from "@/integrations/supabase/client";

type Charity = { id: string; name: string; description: string; image_url: string | null; featured: boolean; events: any };

const CharityProfile = () => {
  const { id } = useParams();
  const [charity, setCharity] = useState<Charity | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    supabase.from("charities").select("*").eq("id", id).maybeSingle()
      .then(({ data }) => { setCharity(data as Charity | null); setLoading(false); document.title = data ? `${(data as any).name} — golfer` : "Charity — golfer"; });
  }, [id]);

  if (loading) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading…</div>;
  if (!charity) return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <div className="container-narrow py-32 text-center">
        <h1 className="font-display text-4xl">Charity not found.</h1>
        <Button asChild variant="outline" className="mt-6"><Link to="/charities">Back to directory</Link></Button>
      </div>
    </div>
  );

  const events = Array.isArray(charity.events) ? charity.events : [];

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <div className="container-narrow py-16">
        <Link to="/charities" className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3 w-3" /> All charities
        </Link>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-8 grid gap-12 md:grid-cols-12">
          <div className="md:col-span-7">
            {charity.featured && <span className="mb-4 inline-block rounded-full bg-accent-soft px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-accent">Featured this month</span>}
            <h1 className="font-display text-5xl leading-tight md:text-6xl">{charity.name}</h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">{charity.description}</p>

            <div className="mt-12">
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Upcoming events</p>
              <div className="mt-4 space-y-3">
                {events.length === 0 && <p className="text-sm text-muted-foreground">No events scheduled at the moment.</p>}
                {events.map((e: any, i: number) => (
                  <div key={i} className="rounded-sm border border-border bg-card p-5">
                    <p className="font-display text-lg">{e.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{e.date}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="md:col-span-5">
            <div className="sticky top-24 rounded-sm border border-border bg-card p-7 shadow-quiet">
              <Heart className="h-5 w-5 text-accent" />
              <p className="mt-4 font-display text-2xl leading-tight">Direct a share of every payment to {charity.name}.</p>
              <p className="mt-3 text-sm text-muted-foreground">Members give a minimum of 10% — adjust upward any time.</p>
              <Button asChild className="mt-6 w-full"><Link to="/signup">Become a member</Link></Button>
              <div className="my-4 flex items-center gap-3 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
              </div>
              <DonateDialog charityId={charity.id} charityName={charity.name} />
              <p className="mt-3 text-[11px] text-muted-foreground">Make a one-off gift without subscribing.</p>
            </div>
          </div>
        </motion.div>
      </div>
      <SiteFooter />
    </div>
  );
};
export default CharityProfile;
