import { Link } from "react-router-dom";

export const Logo = ({ className = "" }: { className?: string }) => (
  <Link to="/" className={`group inline-flex items-center gap-2 ${className}`}>
    <span className="relative inline-block h-2.5 w-2.5 rounded-full bg-accent">
      <span className="absolute inset-0 animate-ping rounded-full bg-accent/40" />
    </span>
    <span className="font-display text-xl tracking-tight">golfer</span>
  </Link>
);
