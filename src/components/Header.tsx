
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export const Header = () => {
  const { user, signOut } = useAuth();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex items-center justify-between mb-8">
      <div className="text-center flex-1">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
          BiohackYourself – Content Management Dashboard
        </h1>
        <p className="text-muted-foreground text-lg">
          Manage user-submitted content and auto-pulled news for social media publishing
        </p>
      </div>
      
      {user && (
        <div className="flex items-center gap-4 ml-8">
          <div className="flex items-center gap-2">
            <Avatar>
              <AvatarFallback className="bg-blue-500 text-white">
                {user.user_metadata?.full_name 
                  ? getInitials(user.user_metadata.full_name)
                  : <User className="h-4 w-4" />
                }
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">
              {user.user_metadata?.full_name || user.email}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={signOut}
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      )}
    </div>
  );
};
