
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3, Clock, CheckCircle, Share2 } from "lucide-react";

interface DashboardStatsProps {
  stats: {
    total: number;
    pending: number;
    approved: number;
    published: number;
    pendingBreakdown: {
      no: number;
      regenerated: number;
      pendingApproval: number;
      empty: number;
    };
  };
  onStatClick: (statType: string) => void;
}

export const DashboardStats = ({ stats, onStatClick }: DashboardStatsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card className="group hover:shadow-2xl transition-all duration-300 hover:scale-105 bg-white/80 backdrop-blur-sm border-0 shadow-lg overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <CardContent className="p-6 relative">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-3xl font-bold text-slate-900">{stats.total}</p>
              <p className="text-sm font-medium text-slate-600">Total Content</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl shadow-lg">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="mt-4 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"></div>
        </CardContent>
      </Card>

      <Card className="group hover:shadow-2xl transition-all duration-300 hover:scale-105 bg-white/80 backdrop-blur-sm border-0 shadow-lg overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <CardContent className="p-6 relative">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-3xl font-bold text-slate-900">{stats.pending}</p>
              <p className="text-sm font-medium text-slate-600">Pending Review</p>
              <div className="text-xs text-slate-500 space-y-1">
                {stats.pendingBreakdown.no > 0 && <div>NO: {stats.pendingBreakdown.no}</div>}
                {stats.pendingBreakdown.regenerated > 0 && <div>Regenerated: {stats.pendingBreakdown.regenerated}</div>}
                {stats.pendingBreakdown.pendingApproval > 0 && <div>Pending Approval: {stats.pendingBreakdown.pendingApproval}</div>}
                {stats.pendingBreakdown.empty > 0 && <div>Empty: {stats.pendingBreakdown.empty}</div>}
              </div>
            </div>
            <div className="p-3 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl shadow-lg">
              <Clock className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="mt-4 h-1 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full"></div>
        </CardContent>
      </Card>

      <Card 
        className="group hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer bg-white/80 backdrop-blur-sm border-0 shadow-lg overflow-hidden"
        onClick={() => onStatClick('approved')}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <CardContent className="p-6 relative">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-3xl font-bold text-slate-900">{stats.approved}</p>
              <p className="text-sm font-medium text-slate-600">Approved</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl shadow-lg">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="mt-4 h-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"></div>
        </CardContent>
      </Card>

      <Card 
        className="group hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer bg-white/80 backdrop-blur-sm border-0 shadow-lg overflow-hidden"
        onClick={() => onStatClick('published')}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <CardContent className="p-6 relative">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-3xl font-bold text-slate-900">{stats.published}</p>
              <p className="text-sm font-medium text-slate-600">Published</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg">
              <Share2 className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="mt-4 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
        </CardContent>
      </Card>
    </div>
  );
};
