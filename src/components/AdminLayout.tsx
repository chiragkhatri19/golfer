import { Link, NavLink, Outlet } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { Users, Heart, Dice5, Trophy, BarChart3 } from "lucide-react";

const items = [
  { to: "/admin", label: "Reports", icon: BarChart3, end: true },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/charities", label: "Charities", icon: Heart },
  { to: "/admin/draws", label: "Draws", icon: Dice5 },
  { to: "/admin/winners", label: "Winners", icon: Trophy },
];

export const AdminLayout = () => {
  const { signOut } = useAuth();
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
        <div className="container-narrow flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Logo />
            <span className="rounded-full bg-accent px-2.5 py-0.5 text-[10px] uppercase tracking-[0.22em] text-accent-foreground">Admin</span>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm"><Link to="/dashboard">My dashboard</Link></Button>
            <Button onClick={signOut} variant="outline" size="sm">Sign out</Button>
          </div>
        </div>
      </header>
      <div className="container-narrow grid gap-10 py-10 md:grid-cols-12">
        <aside className="md:col-span-3">
          <nav className="space-y-1">
            {items.map(({ to, label, icon: Icon, end }) => (
              <NavLink key={to} to={to} end={end as any}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-sm border px-4 py-3 text-sm transition ${isActive ? "border-accent bg-accent-soft/40 text-foreground" : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"}`
                }>
                <Icon className="h-4 w-4" /> {label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <main className="md:col-span-9"><Outlet /></main>
      </div>
    </div>
  );
};
