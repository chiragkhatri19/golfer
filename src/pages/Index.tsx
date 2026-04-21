import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { supabase } from "@/integrations/supabase/client";
import heroImg from "@/assets/hero.jpg";

type Charity = { id: string; name: string; description: string; featured: boolean };

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
} as const;

const Index = () => {
  const [featured, setFeatured] = useState<Charity | null>(null);

  useEffect(() => {
    document.title = "golfer — score for a cause";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "A members club where every score funds a charity. Subscribe, play, and win — every entry contributes.");
    supabase.from("charities").select("id,name,description,featured").eq("featured", true).limit(1).maybeSingle()
      .then(({ data }) => setFeatured(data as Charity | null));
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="container-narrow grid items-center gap-16 pb-24 pt-20 md:grid-cols-12 md:pt-28">
          <div className="md:col-span-7">
            <motion.p
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
              className="mb-6 inline-flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-muted-foreground"
            >
              <span className="h-px w-8 bg-accent" /> A members club for quiet impact
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.05 }}
              className="font-display text-5xl leading-[1.02] tracking-tight text-balance md:text-7xl"
            >
              Every score you play <em className="not-italic text-accent">funds something</em> that matters.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.18 }}
              className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground"
            >
              A subscription club where members log their last five rounds, enter a monthly draw,
              and direct a guaranteed share of every payment to a charity they choose.
            </motion.p>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.35 }}
              className="mt-10 flex flex-wrap items-center gap-4"
            >
              <Button asChild size="lg" className="group h-12 px-7">
                <Link to="/signup">
                  Become a member
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </Button>
              <a href="#how" className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
                How it works
              </a>
            </motion.div>

            <motion.dl
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.5 }}
              className="mt-14 grid max-w-lg grid-cols-3 gap-8 border-t border-border/60 pt-8 text-sm"
            >
              <div>
                <dt className="text-muted-foreground">Min. to charity</dt>
                <dd className="mt-1 font-display text-2xl">10%</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Jackpot share</dt>
                <dd className="mt-1 font-display text-2xl">40%</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Cadence</dt>
                <dd className="mt-1 font-display text-2xl">Monthly</dd>
              </div>
            </motion.dl>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 1.02 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.2 }}
            className="relative md:col-span-5"
          >
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-sm shadow-lift">
              <img src={heroImg} alt="A solitary figure on a vast quiet horizon at dawn" className="h-full w-full object-cover" width={1600} height={1100} />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/30 via-transparent to-transparent" />
            </div>
            <div className="absolute -bottom-6 -left-6 hidden rounded-sm border border-border bg-card p-5 shadow-quiet md:block">
              <p className="font-display text-sm italic text-muted-foreground">"I forgot it was a draw. I just remembered the cause."</p>
              <p className="mt-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">— Member, Q1</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* HOW */}
      <section id="how" className="border-t border-border/60 py-28">
        <div className="container-narrow">
          <motion.div {...fadeUp} className="mb-16 max-w-2xl">
            <p className="mb-3 text-xs uppercase tracking-[0.22em] text-muted-foreground">How it works</p>
            <h2 className="font-display text-4xl leading-tight md:text-5xl">Three quiet steps. One steady contribution.</h2>
          </motion.div>
          <div className="grid gap-px overflow-hidden rounded-sm bg-border md:grid-cols-3">
            {[
              { n: "01", t: "Subscribe", d: "Choose monthly or yearly. A minimum of 10% goes to your chosen charity — adjustable upward, never downward." },
              { n: "02", t: "Log five scores", d: "Enter your last five Stableford rounds. Each new score replaces the oldest. One per date." },
              { n: "03", t: "Enter the draw", d: "Members are entered into a monthly draw. Match three, four, or five — share a transparent prize pool." },
            ].map((s, i) => (
              <motion.div key={i} {...fadeUp} transition={{ ...fadeUp.transition, delay: i * 0.08 }} className="bg-card p-10">
                <p className="font-display text-sm text-accent">{s.n}</p>
                <h3 className="mt-6 font-display text-2xl">{s.t}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{s.d}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CHARITY SPOTLIGHT */}
      <section id="charity" className="py-28">
        <div className="container-narrow">
          <motion.div {...fadeUp} className="grid items-end gap-10 md:grid-cols-12">
            <div className="md:col-span-5">
              <p className="mb-3 text-xs uppercase tracking-[0.22em] text-muted-foreground">Charity in focus</p>
              <h2 className="font-display text-4xl leading-tight md:text-5xl">A cause, every month, in plain view.</h2>
            </div>
            <div className="md:col-span-7">
              <div className="relative overflow-hidden rounded-sm border border-border bg-card p-10 shadow-quiet">
                <Heart className="absolute right-8 top-8 h-5 w-5 text-accent" />
                <p className="text-xs uppercase tracking-[0.18em] text-accent">This month</p>
                <h3 className="mt-3 font-display text-3xl">{featured?.name ?? "Goonj"}</h3>
                <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
                  {featured?.description ?? "Channeling urban surplus to rural and urban underserved communities across India, empowering dignity through sharing."}
                </p>
                <div className="mt-8 flex items-center justify-between border-t border-border/60 pt-6 text-sm">
                  <span className="text-muted-foreground">Member contribution</span>
                  <span className="font-display text-xl">₹0.00 <span className="text-xs text-muted-foreground">/ pending launch</span></span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* DRAW MECHANICS */}
      <section id="draw" className="border-t border-border/60 py-28">
        <div className="container-narrow grid gap-16 md:grid-cols-12">
          <motion.div {...fadeUp} className="md:col-span-5">
            <p className="mb-3 text-xs uppercase tracking-[0.22em] text-muted-foreground">The draw</p>
            <h2 className="font-display text-4xl leading-tight md:text-5xl">Transparent. Mathematical. Monthly.</h2>
            <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
              Each member's five scores form their entry. Every month we draw five numbers — random or
              algorithmically weighted by member activity. The pool, contributions and winners are all published.
            </p>
          </motion.div>
          <div className="md:col-span-7">
            <div className="overflow-hidden rounded-sm border border-border">
              {[
                { tier: "5-match", share: "40%", note: "Jackpot — rolls over if unclaimed" },
                { tier: "4-match", share: "35%", note: "Split equally between winners" },
                { tier: "3-match", share: "25%", note: "Split equally between winners" },
              ].map((r, i) => (
                <motion.div key={i} {...fadeUp} transition={{ ...fadeUp.transition, delay: i * 0.06 }}
                  className="grid grid-cols-12 items-center gap-4 border-b border-border bg-card px-6 py-7 last:border-b-0">
                  <p className="col-span-3 font-display text-2xl">{r.share}</p>
                  <p className="col-span-3 text-sm uppercase tracking-[0.18em] text-muted-foreground">{r.tier}</p>
                  <p className="col-span-6 text-sm text-muted-foreground">{r.note}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32">
        <motion.div {...fadeUp} className="container-narrow text-center">
          <h2 className="mx-auto max-w-3xl font-display text-5xl leading-[1.05] tracking-tight md:text-6xl">
            Play a quiet round. <em className="not-italic text-accent">Move something forward.</em>
          </h2>
          <Button asChild size="lg" className="mt-10 h-12 px-8">
            <Link to="/signup">Become a member <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </motion.div>
      </section>

      <SiteFooter />
    </div>
  );
};

export default Index;
