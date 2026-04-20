import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

type Charity = { id: string; name: string; description: string; image_url: string | null; featured: boolean };

const empty: Charity = { id: "", name: "", description: "", image_url: "", featured: false };

const AdminCharities = () => {
  const [list, setList] = useState<Charity[]>([]);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Charity>(empty);

  const refresh = () => supabase.from("charities").select("*").order("featured", { ascending: false }).order("name")
    .then(({ data }) => setList((data || []) as Charity[]));

  useEffect(() => { document.title = "Admin · Charities — golfer"; refresh(); }, []);

  const save = async () => {
    if (!draft.name || !draft.description) return toast.error("Name and description required.");
    const payload = { name: draft.name, description: draft.description, image_url: draft.image_url || null, featured: draft.featured };
    const res = draft.id
      ? await supabase.from("charities").update(payload).eq("id", draft.id)
      : await supabase.from("charities").insert(payload);
    if (res.error) return toast.error(res.error.message);
    toast.success(draft.id ? "Updated" : "Created");
    setOpen(false); setDraft(empty); refresh();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this charity?")) return;
    const { error } = await supabase.from("charities").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted"); refresh();
  };

  return (
    <div>
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-4xl">Charities</h1>
          <p className="mt-2 text-sm text-muted-foreground">{list.length} listed.</p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setDraft(empty); }}>
          <DialogTrigger asChild><Button onClick={() => setDraft(empty)}><Plus className="mr-2 h-4 w-4" /> New charity</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{draft.id ? "Edit charity" : "New charity"}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Name</Label><Input value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} /></div>
              <div><Label>Description</Label><Textarea rows={4} value={draft.description} onChange={e => setDraft({ ...draft, description: e.target.value })} /></div>
              <div><Label>Image URL</Label><Input value={draft.image_url || ""} onChange={e => setDraft({ ...draft, image_url: e.target.value })} /></div>
              <div className="flex items-center gap-3"><Switch checked={draft.featured} onCheckedChange={v => setDraft({ ...draft, featured: v })} /><Label>Featured</Label></div>
            </div>
            <DialogFooter><Button onClick={save}>Save</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-8 space-y-3">
        {list.map(c => (
          <div key={c.id} className="flex items-start justify-between gap-6 rounded-sm border border-border bg-card p-5">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <p className="font-display text-lg">{c.name}</p>
                {c.featured && <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-accent">Featured</span>}
              </div>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{c.description}</p>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={() => { setDraft(c); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => remove(c.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default AdminCharities;
