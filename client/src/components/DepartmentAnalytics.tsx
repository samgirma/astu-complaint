import { useState, useEffect } from 'react';
import { FileText, Clock, CheckCircle2, AlertCircle, TrendingUp, TrendingDown, Users } from 'lucide-react';
import api from '@/utils/api';

interface DepartmentStats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  averageResolutionTime: number;
  thisMonth: number;
  lastMonth: number;
}

const DepartmentAnalytics = ({ departmentId }: { departmentId: string }) => {
  const [stats, setStats] = useState<DepartmentStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await api.get('/complaints/stats');
      setStats(response.data.data);
    } catch (error) {
      console.error('Failed to fetch department stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [departmentId]);

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) {
      return <TrendingUp className="h-4 w-4 text-success" />;
    } else if (current < previous) {
      return <TrendingDown className="h-4 w-4 text-destructive" />;
    }
    return <div className="h-4 w-4" />;
  };

  const getTrendColor = (current: number, previous: number) => {
    if (current > previous) return 'text-success';
    if (current < previous) return 'text-destructive';
    return 'text-muted-foreground';
  };

  const getTrendText = (current: number, previous: number) => {
    if (current === previous) return 'No change';
    const change = Math.abs(((current - previous) / previous) * 100).toFixed(1);
    return `${change}% ${current > previous ? 'increase' : 'decrease'}`;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5 shadow-card">
            <div className="animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-muted rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center text-muted-foreground">
        <p>Unable to load department statistics</p>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Complaints',
      value: stats.total.toString(),
      icon: FileText,
      color: 'text-primary',
      description: 'All time complaints for your department'
    },
    {
      label: 'Open',
      value: stats.open.toString(),
      icon: AlertCircle,
      color: 'text-warning',
      description: 'Pending complaints'
    },
    {
      label: 'In Progress',
      value: stats.inProgress.toString(),
      icon: Clock,
      color: 'text-info',
      description: 'Being worked on'
    },
    {
      label: 'Resolved',
      value: stats.resolved.toString(),
      icon: CheckCircle2,
      color: 'text-success',
      description: 'Successfully completed'
    }
  ];

  const resolutionRate = stats.total > 0 ? ((stats.resolved / stats.total) * 100).toFixed(1) : '0';
  const avgResolutionDays = stats.averageResolutionTime ? (stats.averageResolutionTime / 24).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-card p-5 shadow-card">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">{stat.label}</span>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <p className="mt-2 text-3xl font-bold text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
          </div>
        ))}
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">Resolution Rate</span>
            <CheckCircle2 className="h-5 w-5 text-success" />
          </div>
          <p className="text-2xl font-bold text-foreground">{resolutionRate}%</p>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.resolved} of {stats.total} complaints resolved
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">Avg Resolution Time</span>
            <Clock className="h-5 w-5 text-info" />
          </div>
          <p className="text-2xl font-bold text-foreground">{avgResolutionDays} days</p>
          <p className="text-xs text-muted-foreground mt-1">
            Average time to resolve complaints
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">Monthly Trend</span>
            {getTrendIcon(stats.thisMonth, stats.lastMonth)}
          </div>
          <div className="flex items-baseline space-x-2">
            <p className="text-2xl font-bold text-foreground">{stats.thisMonth}</p>
            <p className={`text-sm ${getTrendColor(stats.thisMonth, stats.lastMonth)}`}>
              {getTrendText(stats.thisMonth, stats.lastMonth)}
            </p>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            This month vs last month ({stats.lastMonth})
          </p>
        </div>
      </div>

      {/* Quick Stats Summary */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-card">
        <h3 className="text-lg font-semibold text-foreground mb-4">Department Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Active Workload</span>
              <span className="text-sm font-medium text-foreground">
                {stats.open + stats.inProgress} complaints
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-warning h-2 rounded-full" 
                style={{ width: `${stats.total > 0 ? (stats.open / stats.total) * 100 : 0}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Open: {stats.open}</span>
              <span>In Progress: {stats.inProgress}</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Success Rate</span>
              <span className="text-sm font-medium text-success">{resolutionRate}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-success h-2 rounded-full" 
                style={{ width: `${resolutionRate}%` }}
              ></div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.resolved} resolved out of {stats.total} total
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepartmentAnalytics;
