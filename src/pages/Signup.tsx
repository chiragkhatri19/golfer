import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/lib/auth";

type Charity = { id: string; name: string; description: string };

const Signup = () => {
  const nav = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [charities, setCharities] = useState<Charity[]>([]);
  const [charityId, setCharityId] = useState<string>("");
  const [plan, setPlan] = useState<"monthly" | "yearly">("yearly");
  const [loading, setLoading] = useState(false);

  useEffect(() => { document.title = "Become a member — golfer"; }, []);
  useEffect(() => { if (user) nav("/dashboard"); }, [user, nav]);
  useEffect(() => {
    supabase.from("charities").select("id,name,description").order("featured", { ascending: false })
      .then(({ data }) => setCharities((data || []) as Charity[]));
  }, []);

  const next = () => {
    if (step === 1 && (!name || !email || password.length < 6)) return toast.error("Fill all fields. Password ≥ 6 chars.");
    if (step === 2 && !charityId) return toast.error("Pick a charity.");
    setStep(s => s + 1);
  };

  const submit = async () => {
    setLoading(true);
    const redirectUrl = `${window.location.origin}/dashboard`;
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: redirectUrl, data: { name } },
    });
    if (error) { setLoading(false); return toast.error(error.message); }

    // After signup, profile row is created by trigger. Update charity + plan.
    const userId = data.user?.id;
    if (userId) {
      // Wait briefly for trigger; then update.
      await new Promise(r => setTimeout(r, 400));
      await supabase.from("profiles").update({
        charity_id: charityId, charity_pct: 10,
        subscription_plan: plan,
        subscription_status: "pending_payment",
      }).eq("user_id", userId);
      await supabase.from("subscriptions").upsert({
        user_id: userId, plan, status: "pending_payment",
      });
    }
    setLoading(false);
    toast.success("Welcome to golfer.");
    nav("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container-narrow flex h-16 items-center justify-between">
        <Logo />
        <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Step {step} / 3</p>
      </div>

      <div className="container-narrow grid min-h-[85vh] items-start gap-16 py-12 md:grid-cols-12">
        <div className="md:col-span-4">
          <motion.h1 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="font-display text-5xl leading-tight">
            {step === 1 && "Make your account."}
            {step === 2 && "Choose a cause."}
            {step === 3 && "Pick a rhythm."}
          </motion.h1>
          <p className="mt-4 max-w-sm text-sm text-muted-foreground">
            {step === 1 && "Three quiet steps. Cancel any time."}
            {step === 2 && "A guaranteed share of every payment goes here. You can change it later."}
            {step === 3 && "Yearly is gentler on the planet of admin and saves you 16%."}
          </p>
          <ol className="mt-10 space-y-3 text-sm">
            {["Account", "Charity", "Plan"].map((label, i) => (
              <li key={label} className={`flex items-center gap-3 ${step > i ? "text-foreground" : "text-muted-foreground"}`}>
                <span className={`flex h-6 w-6 items-center justify-center rounded-full border ${step > i ? "border-accent bg-accent text-accent-foreground" : "border-border"}`}>
                  {step > i + 1 ? <Check className="h-3 w-3" /> : i + 1}
                </span>
                {label}
              </li>
            ))}
          </ol>
        </div>

        <div className="md:col-span-8">
          <div className="rounded-sm border border-border bg-card p-8 shadow-quiet md:p-10">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div key="1" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} className="space-y-5">
                  <div className="space-y-2"><Label>Name</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" /></div>
                  <div className="space-y-2"><Label>Email</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} /></div>
                  <div className="space-y-2"><Label>Password</Label><Input type="password" value={password} onChange={e => setPassword(e.target.value)} /></div>
                </motion.div>
              )}
              {step === 2 && (
                <motion.div key="2" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} className="grid gap-3 md:grid-cols-2">
                  {charities.map(c => {
                    const sel = charityId === c.id;
                    return (
                      <button key={c.id} type="button" onClick={() => setCharityId(c.id)}
                        className={`group relative rounded-sm border p-5 text-left transition-all ${sel ? "border-accent bg-accent-soft/40" : "border-border hover:border-foreground/40"}`}>
                        <p className="font-display text-lg">{c.name}</p>
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{c.description}</p>
                        {sel && <Check className="absolute right-4 top-4 h-4 w-4 text-accent" />}
                      </button>
                    );
                  })}
                </motion.div>
              )}
              {step === 3 && (
                <motion.div key="3" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} className="grid gap-4 md:grid-cols-2">
                  {([
                    { id: "monthly", label: "Monthly", price: "£12", sub: "per month", note: "Cancel any time." },
                    { id: "yearly", label: "Yearly", price: "£120", sub: "per year", note: "Save 16% vs monthly." },
                  ] as const).map(p => {
                    const sel = plan === p.id;
                    return (
                      <button key={p.id} type="button" onClick={() => setPlan(p.id)}
                        className={`relative rounded-sm border p-6 text-left transition-all ${sel ? "border-accent bg-accent-soft/40" : "border-border hover:border-foreground/40"}`}>
                        <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">{p.label}</p>
                        <p className="mt-3 font-display text-4xl">{p.price}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{p.sub}</p>
                        <p className="mt-4 text-xs text-muted-foreground">{p.note}</p>
                        {sel && <Check className="absolute right-4 top-4 h-4 w-4 text-accent" />}
                      </button>
                    );
                  })}
                  <p className="md:col-span-2 text-xs text-muted-foreground">
                    Payment integration is currently in setup. You'll create your account now and complete checkout from your dashboard.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-10 flex items-center justify-between">
              <Button type="button" variant="ghost" disabled={step === 1} onClick={() => setStep(s => s - 1)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              {step < 3 ? (
                <Button type="button" onClick={next}>Continue <ArrowRight className="ml-2 h-4 w-4" /></Button>
              ) : (
                <Button type="button" onClick={submit} disabled={loading}>{loading ? "Creating…" : "Create membership"}</Button>
              )}
            </div>
          </div>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already a member? <Link to="/login" className="text-accent underline-offset-4 hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
