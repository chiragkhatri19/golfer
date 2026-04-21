import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

type N = { id: string; title: string; body: string | null; link: string | null; read: boolean; created_at: string };

export const NotificationBell = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<N[]>([]);

  const refresh = () => {
    if (!user) return;
    supabase.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20)
      .then(({ data }) => setItems((data || []) as N[]));
  };

  useEffect(() => {
    if (!user) return;
    refresh();
    const ch = supabase.channel("notif-" + user.id)
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => refresh())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line
  }, [user]);

  const unread = items.filter(i => !i.read).length;

  const markAll = async () => {
    if (!user) return;
    await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
    refresh();
  };

  if (!user) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          {unread > 0 && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-accent" />}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Notifications</p>
          {unread > 0 && <button onClick={markAll} className="text-xs text-accent hover:underline">Mark all read</button>}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {items.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">Nothing yet.</p>}
          {items.map(n => {
            const inner = (
              <div className={`border-b border-border px-4 py-3 last:border-b-0 ${n.read ? "opacity-60" : ""}`}>
                <p className="text-sm font-medium">{n.title}</p>
                {n.body && <p className="mt-1 text-xs text-muted-foreground">{n.body}</p>}
                <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</p>
              </div>
            );
            return n.link
              ? <Link key={n.id} to={n.link} className="block hover:bg-secondary/50">{inner}</Link>
              : <div key={n.id}>{inner}</div>;
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
};
