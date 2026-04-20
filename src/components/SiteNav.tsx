import { Link, useLocation } from "react-router-dom";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useIsAdmin } from "@/lib/roles";
import { Shield } from "lucide-react";

export const SiteNav = () => {
  const { user, signOut } = useAuth();
  const { isAdmin } = useIsAdmin();
  const loc = useLocation();

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="container-narrow flex h-16 items-center justify-between">
        <Logo />
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <Link to="/#how" className="transition-colors hover:text-foreground">How it works</Link>
          <Link to="/#draw" className="transition-colors hover:text-foreground">The draw</Link>
          <Link to="/charities" className="transition-colors hover:text-foreground">Charities</Link>
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              {isAdmin && loc.pathname !== "/admin" && (
                <Button asChild variant="ghost" size="sm"><Link to="/admin"><Shield className="mr-1.5 h-3.5 w-3.5" /> Admin</Link></Button>
              )}
              {loc.pathname !== "/dashboard" && (
                <Button asChild variant="ghost" size="sm"><Link to="/dashboard">Dashboard</Link></Button>
              )}
              <Button onClick={signOut} variant="outline" size="sm">Sign out</Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm"><Link to="/login">Sign in</Link></Button>
              <Button asChild size="sm"><Link to="/signup">Subscribe</Link></Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
