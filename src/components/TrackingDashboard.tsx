
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, CheckCircle, RefreshCw, Clock, Share2 } from "lucide-react";

interface TrackingDashboardProps {
  stats: {
    approved: number;
    sentForRegeneration: number;
    pendingApproval: number;
    published: number;
  };
}

export const TrackingDashboard = ({ stats }: TrackingDashboardProps) => {
  const metrics = [
    {
      label: "Approved",
      value: stats.approved,
      icon: CheckCircle,
      gradient: "from-green-500 to-emerald-500",
      bg: "from-green-50 to-emerald-50",
      iconBg: "from-green-500 to-emerald-500"
    },
    {
      label: "Sent for Regeneration",
      value: stats.sentForRegeneration,
      icon: RefreshCw,
      gradient: "from-yellow-500 to-orange-500",
      bg: "from-yellow-50 to-orange-50",
      iconBg: "from-yellow-500 to-orange-500"
    },
    {
      label: "Pending Approval",
      value: stats.pendingApproval,
      icon: Clock,
      gradient: "from-blue-500 to-indigo-500",
      bg: "from-blue-50 to-indigo-50",
      iconBg: "from-blue-500 to-indigo-500"
    },
    {
      label: "Published",
      value: stats.published,
      icon: Share2,
      gradient: "from-purple-500 to-pink-500",
      bg: "from-purple-50 to-pink-50",
      iconBg: "from-purple-500 to-pink-500"
    }
  ];

  return (
    <div className="space-y-8">
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-b border-slate-200/50">
          <CardTitle className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl">Content Tracking Dashboard</span>
          </CardTitle>
          <CardDescription className="text-slate-600">
            Track content approval and publishing metrics across all platforms
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {metrics.map((metric, index) => {
              const Icon = metric.icon;
              return (
                <div
                  key={metric.label}
                  className="group relative overflow-hidden rounded-2xl bg-gradient-to-br bg-white border border-slate-200/50 hover:shadow-lg transitio-all duration-300 hover:scale-105"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${metric.bg} opacity-50`}></div>
                  <div className="relative p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className={`p-3 bg-gradient-to-r ${metric.iconBg} rounded-xl shadow-lg`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-slate-900">{metric.value}</div>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-600">{metric.label}</div>
                      <div className={`mt-2 h-1 bg-gradient-to-r ${metric.gradient} rounded-full`}></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
