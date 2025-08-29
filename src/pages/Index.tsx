/*// src/pages/Index.tsx
import { useAuth } from "@/context/AuthProvider";
import { AuthPage } from "@/components/AuthPage";
import Dashboard from "@/components/Dashboard";

export default function Index() {
  const { user, loading } = useAuth();
  if (loading)
    return <div className="min-h-screen grid place-items-center">Loading…</div>;
  if (!user) return <AuthPage />;
  return <Dashboard />;
} */

// src/pages/Index.tsx
import Dashboard from "@/components/Dashboard";

export default function Index() {
  return <Dashboard />;
}
