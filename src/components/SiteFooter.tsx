import { Logo } from "./Logo";

export const SiteFooter = () => (
  <footer className="mt-32 border-t border-border/60">
    <div className="container-narrow grid gap-10 py-16 md:grid-cols-4">
      <div className="md:col-span-2">
        <Logo />
        <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
          A members club where every score played funds a cause that matters. Quiet, deliberate, charity-first.
        </p>
      </div>
      <div>
        <p className="mb-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">Platform</p>
        <ul className="space-y-2 text-sm">
          <li><a href="/#how" className="hover:text-accent">How it works</a></li>
          <li><a href="/#draw" className="hover:text-accent">The draw</a></li>
          <li><a href="/#charity" className="hover:text-accent">Charity</a></li>
        </ul>
      </div>
      <div>
        <p className="mb-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">Account</p>
        <ul className="space-y-2 text-sm">
          <li><a href="/signup" className="hover:text-accent">Become a member</a></li>
          <li><a href="/login" className="hover:text-accent">Sign in</a></li>
        </ul>
      </div>
    </div>
    <div className="hairline">
      <div className="container-narrow flex flex-col items-start justify-between gap-2 py-6 text-xs text-muted-foreground md:flex-row md:items-center">
        <span>© {new Date().getFullYear()} golfer — every entry, a contribution.</span>
        <span className="font-display italic">Quiet impact, by design.</span>
      </div>
    </div>
  </footer>
);
