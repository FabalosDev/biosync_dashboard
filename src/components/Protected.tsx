// components/Protected.tsx
"use client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

export function Protected({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth() as { user: any; loading?: boolean };
  if (loading ?? user === undefined)
    return (
      <div className="min-h-screen grid place-items-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  if (!user) {
    if (typeof window !== "undefined") window.location.href = "/login";
    return null;
  }
  return <>{children}</>;
}
