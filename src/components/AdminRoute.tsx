import { Navigate } from "react-router-dom";
import { useIsAdmin } from "@/lib/roles";

export const AdminRoute = ({ children }: { children: JSX.Element }) => {
  const { isAdmin, loading } = useIsAdmin();
  if (loading) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Checking access…</div>;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  return children;
};
