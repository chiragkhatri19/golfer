import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminRoute } from "@/components/AdminRoute";
import { AdminLayout } from "@/components/AdminLayout";
import Index from "./pages/Index.tsx";
import Login from "./pages/Login.tsx";
import Signup from "./pages/Signup.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import Charities from "./pages/Charities.tsx";
import CharityProfile from "./pages/CharityProfile.tsx";
import AdminReports from "./pages/admin/AdminReports.tsx";
import AdminUsers from "./pages/admin/AdminUsers.tsx";
import AdminCharities from "./pages/admin/AdminCharities.tsx";
import AdminDraws from "./pages/admin/AdminDraws.tsx";
import AdminWinners from "./pages/admin/AdminWinners.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/charities" element={<Charities />} />
            <Route path="/charities/:id" element={<CharityProfile />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><AdminRoute><AdminLayout /></AdminRoute></ProtectedRoute>}>
              <Route index element={<AdminReports />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="charities" element={<AdminCharities />} />
              <Route path="draws" element={<AdminDraws />} />
              <Route path="winners" element={<AdminWinners />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
