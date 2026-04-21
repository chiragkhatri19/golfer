import { useState } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { z } from "zod";

const schema = z.object({
  amount: z.number().positive().max(100000),
  donor_name: z.string().trim().max(100).optional(),
  donor_email: z.string().trim().email().max(255).optional().or(z.literal("")),
});

export const DonateDialog = ({ charityId, charityName, trigger }: { charityId: string; charityName: string; trigger?: React.ReactNode }) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("25");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ amount: parseFloat(amount), donor_name: name || undefined, donor_email: email || undefined });
    if (!parsed.success) return toast.error(Object.values(parsed.error.flatten().fieldErrors).flat()[0] || "Check your details.");
    setBusy(true);
    const { error } = await supabase.from("donations").insert({
      charity_id: charityId,
      amount: parsed.data.amount,
      donor_name: parsed.data.donor_name ?? null,
      donor_email: parsed.data.donor_email || null,
      user_id: user?.id ?? null,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Thank you. Your gift has been recorded.");
    setOpen(false); setAmount("25"); setName(""); setEmail("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button variant="outline" className="w-full"><Heart className="mr-2 h-4 w-4" /> Make a one-off gift</Button>}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Donate to {charityName}</DialogTitle>
          <DialogDescription>A one-off contribution, separate from your subscription.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2"><Label>Amount (£)</Label>
            <Input type="number" min={1} step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required /></div>
          <div className="space-y-2"><Label>Your name (optional)</Label>
            <Input value={name} onChange={e => setName(e.target.value)} maxLength={100} /></div>
          <div className="space-y-2"><Label>Email (optional)</Label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} maxLength={255} /></div>
          <Button type="submit" className="w-full" disabled={busy}>{busy ? "Recording…" : "Give"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
