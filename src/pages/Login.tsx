import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/lib/auth";

const Login = () => {
  const nav = useNavigate();
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => { document.title = "Sign in — golfer"; }, []);
  useEffect(() => { if (user) nav("/dashboard"); }, [user, nav]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back.");
    nav("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container-narrow flex h-16 items-center"><Logo /></div>
      <div className="container-narrow grid min-h-[80vh] items-center md:grid-cols-2 md:gap-20">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="hidden md:block">
          <p className="mb-3 text-xs uppercase tracking-[0.22em] text-muted-foreground">Members area</p>
          <h1 className="font-display text-5xl leading-tight">Welcome back.</h1>
          <p className="mt-6 max-w-md text-muted-foreground">Sign in to log your latest scores, adjust your charity, and see your draw status.</p>
        </motion.div>
        <motion.form
          onSubmit={onSubmit}
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
          className="mx-auto w-full max-w-sm space-y-5 rounded-sm border border-border bg-card p-8 shadow-quiet"
        >
          <h2 className="font-display text-2xl">Sign in</h2>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pwd">Password</Label>
            <Input id="pwd" type="password" required value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>{loading ? "Signing in…" : "Sign in"}</Button>
          <p className="text-center text-sm text-muted-foreground">
            New here? <Link to="/signup" className="text-accent underline-offset-4 hover:underline">Become a member</Link>
          </p>
        </motion.form>
      </div>
    </div>
  );
};

export default Login;
