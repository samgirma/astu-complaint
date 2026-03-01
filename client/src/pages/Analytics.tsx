import { useState, useEffect } from "react";
import { BarChart3, TrendingUp, PieChart, Activity } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import api from "@/utils/api";

const Analytics = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<any>(null);

  // Fetch real analytics data from API
  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      let response;
      if (user?.role === 'admin') {
        // Admin gets comprehensive analytics
        response = await api.get('/admin/analytics');
      } else {
        // Staff/Student get basic stats
        response = await api.get('/complaints/stats');
      }
      
      setAnalyticsData(response.data.data);
      
    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Extract data from analytics response
  const overview = analyticsData?.overview || {};
  const complaintsByDepartment = analyticsData?.complaintsByDepartment || [];
  const resolutionRate = overview.resolutionRate || 0;
  const avgResolutionTime = overview.avgResolutionTime || 0;

  // Transform department data for chart
  const categoryData = complaintsByDepartment.map((dept: any) => ({
    name: dept.name || dept.departmentName || 'Unknown',
    count: dept.count || dept.totalComplaints || 0,
    pct: Math.round(((dept.count || dept.totalComplaints || 0) / (overview.totalComplaints || 1)) * 100)
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">Insights into complaint trends and resolution performance.</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
            <Activity className="h-4 w-4" /> Avg. Resolution Time
          </div>
          <p className="mt-2 text-3xl font-bold text-foreground">{avgResolutionTime} <span className="text-lg font-normal text-muted-foreground">days</span></p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
            <TrendingUp className="h-4 w-4" /> Resolution Rate
          </div>
          <p className="mt-2 text-3xl font-bold text-success">{resolutionRate}%</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
            <PieChart className="h-4 w-4" /> Satisfaction Score
          </div>
          <p className="mt-2 text-3xl font-bold text-primary">4.2<span className="text-lg font-normal text-muted-foreground">/5</span></p>
        </div>
      </div>

      {/* Category breakdown */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-card">
        <h2 className="text-lg font-semibold text-foreground mb-4">Complaints by Category</h2>
        <div className="space-y-3">
          {categoryData.map((cat) => (
            <div key={cat.name} className="flex items-center gap-4">
              <span className="w-24 text-sm font-medium text-foreground">{cat.name}</span>
              <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${cat.pct}%` }}
                />
              </div>
              <span className="text-sm text-muted-foreground w-12 text-right">{cat.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
