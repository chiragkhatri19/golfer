import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Eye } from "lucide-react";

type Winner = {
  id: string; draw_id: string; user_id: string; tier: number;
  prize_amount: number; status: string; proof_url: string | null; created_at: string;
};
type Profile = { user_id: string; name: string | null; email: string | null };

const AdminWinners = () => {
  const [rows, setRows] = useState<Winner[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});

  const refresh = async () => {
    const { data: w } = await supabase.from("winners").select("*").order("created_at", { ascending: false });
    setRows((w || []) as Winner[]);
    const ids = [...new Set((w || []).map((x: any) => x.user_id))];
    if (ids.length) {
      const { data: p } = await supabase.from("profiles").select("user_id,name,email").in("user_id", ids);
      const map: Record<string, Profile> = {};
      for (const row of (p || []) as Profile[]) map[row.user_id] = row;
      setProfiles(map);
    }
  };
  useEffect(() => { document.title = "Admin · Winners — golfer"; refresh(); }, []);

  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("winners").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Updated"); refresh();
  };

  const viewProof = async (path: string) => {
    const { data, error } = await supabase.storage.from("winner-proofs").createSignedUrl(path, 60);
    if (error || !data) return toast.error("Could not load proof");
    window.open(data.signedUrl, "_blank");
  };

  return (
    <div>
      <h1 className="font-display text-4xl">Winners</h1>
      <p className="mt-2 text-sm text-muted-foreground">Verify proof, then mark paid.</p>
      <div className="mt-8 space-y-3">
        {rows.map(w => {
          const p = profiles[w.user_id];
          return (
            <div key={w.id} className="grid grid-cols-12 items-center gap-4 rounded-sm border border-border bg-card p-5 text-sm">
              <div className="col-span-4">
                <p className="font-medium">{p?.name || "—"}</p>
                <p className="text-xs text-muted-foreground">{p?.email}</p>
              </div>
              <div className="col-span-2"><p className="font-display text-lg">{w.tier}-match</p></div>
              <div className="col-span-2"><p className="font-display text-lg">₹${Number(w.prize_amount).toFixed(2)}</p></div>
              <div className="col-span-2">
                {w.proof_url ? (
                  <Button variant="outline" size="sm" onClick={() => viewProof(w.proof_url!)}><Eye className="mr-2 h-3 w-3" /> Proof</Button>
                ) : <span className="text-xs text-muted-foreground">No proof</span>}
              </div>
              <div className="col-span-2">
                <Select value={w.status} onValueChange={v => setStatus(w.id, v)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          );
        })}
        {rows.length === 0 && <p className="rounded-sm border border-dashed border-border p-10 text-center text-sm text-muted-foreground">No winners yet. Publish a draw to populate this list.</p>}
      </div>
    </div>
  );
};
export default AdminWinners;
