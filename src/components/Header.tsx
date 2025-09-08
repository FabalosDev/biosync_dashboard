"use client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, LogIn, User, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

type AnyUser =
  | {
      email?: string | null;
      user_metadata?: Record<string, any> | null;
    }
  | null
  | undefined;

const pickDisplayName = (u: AnyUser) =>
  (
    u?.user_metadata?.full_name ??
    u?.user_metadata?.name ??
    u?.user_metadata?.user_name ??
    u?.email ??
    ""
  ).toString();

const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

export const Header = () => {
  // Ideally your hook exposes loading. If not, you can approximate:
  // - undefined => loading
  // - null => signed out
  // - object => signed in
  const { user, signOut, signIn, loading } = useAuth() as {
    user: AnyUser;
    loading?: boolean; // make optional if your hook doesn't return it
    signOut: () => void;
    signIn?: () => void; // optional if you have a sign-in action
  };

  const isLoading = loading ?? user === undefined;
  const isSignedIn = !!user;

  const name = pickDisplayName(user);
  const initials = getInitials(name);

  return (
    <header className="flex items-center justify-between mb-10 relative z-20">
      {/* Brand */}
      <div className="text-center flex-1">
        <div className="flex items-center justify-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Fabaverse – Foxther's Universe
          </h1>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4 ml-8 min-w-[220px] justify-end">
        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center gap-2 text-slate-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Loading…</span>
          </div>
        )}

        {/* Signed in */}
        {!isLoading && isSignedIn && (
          <>
            <div className="flex items-center gap-2">
              <Avatar className="border border-blue-200 shadow-sm">
                <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold">
                  {name ? initials : <User className="h-4 w-4" />}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-slate-700 max-w-[200px] truncate">
                {name || "User"}
              </span>
            </div>
          </>
        )}

        {/* Signed out */}
        {!isLoading && !isSignedIn && (
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              typeof signIn === "function" ? signIn() : undefined
            }
            className="flex items-center gap-2 border-slate-300 text-slate-700 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-500 hover:text-white"
          >
            <LogIn className="h-4 w-4" />
            Sign In
          </Button>
        )}
      </div>
    </header>
  );
};
