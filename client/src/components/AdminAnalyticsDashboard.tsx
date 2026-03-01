import React, { useState, useMemo, useEffect } from "react";
import {
  FileText,
  Clock,
  TrendingUp,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit3,
  MoreHorizontal,
  BarChart3,
  Users,
  AlertTriangle,
  Building,
  Calendar,
  CheckCircle,
  AlertCircle,
  XCircle,
  RefreshCw,
  UserCheck,
  Activity,
  MessageSquare,
  Bell,
  X
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import api from "@/utils/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

interface Complaint {
  id: string;
  studentName: string;
  department: string;
  category: string;
  status: string;
  submittedDate: string;
  priority: string;
  description: string;
}

interface StatusUpdate {
  id: string;
  complaintId: string;
  status: string;
  timestamp: string;
  updatedBy: string;
}

interface KPICards {
  totalComplaints: number;
  resolvedComplaints: number;
  avgResolutionTime: number;
  mostReportedCategory: string;
  resolutionRate: string;
  totalComplaintsTrend?: string;
  resolutionTimeTrend?: string;
}

const AdminAnalyticsDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [statusUpdates, setStatusUpdates] = useState<StatusUpdate[]>([]);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [staffMembers, setStaffMembers] = useState<any[]>([]);
  const [warningStats, setWarningStats] = useState({
    staleOpenComplaints: 0,
    overdueComplaints: 0,
    unconfirmedResolutions: 0,
    totalWarningsNeeded: 0
  });
  
  // Real data state
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [kpiData, setKpiData] = useState<KPICards>({
    totalComplaints: 0,
    resolvedComplaints: 0,
    avgResolutionTime: 0,
    mostReportedCategory: "",
    resolutionRate: "0%",
    totalComplaintsTrend: "0%",
    resolutionTimeTrend: "0 days"
  });

  // Fetch real data from API
  useEffect(() => {
    fetchAnalyticsData();
    fetchWarningStatistics();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Fetch complaints data
      const complaintsResponse = await api.get('/admin/analytics');
      const analyticsData = complaintsResponse.data.data.analytics;
      
      // Use real complaints data from analytics
      const transformedComplaints: Complaint[] = analyticsData.individualComplaints || [];
      
      setComplaints(transformedComplaints);
      
      // Set KPI data from analytics
      if (analyticsData.overview) {
        // Calculate resolved complaints from status data
        const resolvedStatus = analyticsData.complaintsByStatus?.find(s => s.status === 'RESOLVED');
        const resolvedCount = resolvedStatus?.count || 0;
        
        // Calculate resolution rate
        const resolutionRate = analyticsData.overview.totalComplaints > 0 
          ? ((resolvedCount / analyticsData.overview.totalComplaints) * 100).toFixed(1) + '%'
          : '0%';
        
        // Find most reported department
        const mostReportedDept = analyticsData.complaintsByDepartment?.[0]?.departmentName || 'N/A';
        
        setKpiData({
          totalComplaints: analyticsData.overview.totalComplaints || 0,
          resolvedComplaints: resolvedCount,
          avgResolutionTime: 0, // Calculate this if needed
          mostReportedCategory: mostReportedDept,
          resolutionRate: resolutionRate,
          totalComplaintsTrend: '+' + (analyticsData.overview.recentComplaints || 0),
          resolutionTimeTrend: '0 days' // Calculate this if needed
        });
      }
      
      // Set departments
      if (analyticsData.departmentPerformance) {
        setDepartments(analyticsData.departmentPerformance.map((dept: any) => ({
          name: dept.name,
          count: dept.totalComplaints
        })));
      }
      
      // Fetch staff members
      try {
        const staffResponse = await api.get('/admin/staff/departments');
        setStaffMembers(staffResponse.data.data.departments || []);
      } catch (error) {
        console.error('Failed to fetch staff departments:', error);
      }
      
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

  const fetchWarningStatistics = async () => {
    try {
      const response = await api.get('/warnings/statistics');
      setWarningStats(response.data.data);
    } catch (error) {
      console.error('Failed to fetch warning statistics:', error);
    }
  };

  const triggerWarningCheck = async () => {
    try {
      await api.post('/warnings/check');
      toast({
        title: "Success",
        description: "Warning check completed successfully",
      });
      fetchWarningStatistics();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to trigger warning check",
        variant: "destructive"
      });
    }
  };

  const categories = useMemo(() => {
    const catNames = [...new Set(complaints.map(c => c.category))];
    return catNames;
  }, [complaints]);

  // KPI Calculations (now using real data)
  const calculatedKPI = useMemo(() => {
    const totalComplaints = complaints.length;
    const resolvedComplaints = complaints.filter(c => c.status === "resolved").length;
    const avgResolutionTime = kpiData.avgResolutionTime;
    
    const categoryCounts = complaints.reduce((acc, complaint) => {
      acc[complaint.category] = (acc[complaint.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const mostReportedCategory = Object.entries(categoryCounts).length > 0 
      ? Object.entries(categoryCounts).reduce((a, b) => 
          categoryCounts[a[0]] > categoryCounts[b[0]] ? a : b
        )?.[0] || "N/A"
      : "N/A";

    return {
      totalComplaints,
      resolvedComplaints,
      avgResolutionTime,
      mostReportedCategory,
      resolutionRate: totalComplaints > 0 ? ((resolvedComplaints / totalComplaints) * 100).toFixed(1) + "%" : "0%"
    };
  }, [complaints, kpiData]);

  // Chart Data
  const departmentData = useMemo(() => {
    const deptCounts = complaints.reduce((acc, complaint) => {
      acc[complaint.department] = (acc[complaint.department] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(deptCounts).map(([dept, count]) => ({
      department: dept.split(' ')[0], // Shorten department names
      complaints: count
    }));
  }, [complaints]);

  const statusData = useMemo(() => {
    const statusCounts = complaints.reduce((acc, complaint) => {
      acc[complaint.status] = (acc[complaint.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return [
      { name: "Pending", value: statusCounts.pending || 0, color: "#f59e0b" },
      { name: "In Progress", value: statusCounts["in-progress"] || 0, color: "#3b82f6" },
      { name: "Resolved", value: statusCounts.resolved || 0, color: "#10b981" },
      { name: "Escalated", value: statusCounts.escalated || 0, color: "#ef4444" }
    ];
  }, [complaints]);

  // Filter and paginate complaints
  const filteredComplaints = useMemo(() => {
    return complaints.filter(complaint => {
      const matchesSearch = complaint.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           complaint.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           complaint.department.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = selectedStatus === "all" || complaint.status === selectedStatus;
      const matchesDepartment = selectedDepartment === "all" || complaint.department === selectedDepartment;
      
      return matchesSearch && matchesStatus && matchesDepartment;
    });
  }, [complaints, searchTerm, selectedStatus, selectedDepartment]);

  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredComplaints.length / itemsPerPage);
  const paginatedComplaints = filteredComplaints.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending": return <Clock className="h-4 w-4 text-amber-500" />;
      case "in-progress": return <AlertCircle className="h-4 w-4 text-blue-500" />;
      case "resolved": return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "escalated": return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-amber-100 text-amber-800 border-amber-200";
      case "in-progress": return "bg-blue-100 text-blue-800 border-blue-200";
      case "resolved": return "bg-green-100 text-green-800 border-green-200";
      case "escalated": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-700";
      case "medium": return "bg-amber-100 text-amber-700";
      case "low": return "bg-green-100 text-green-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const toggleRowExpansion = (complaintId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(complaintId)) {
      newExpanded.delete(complaintId);
    } else {
      newExpanded.add(complaintId);
    }
    setExpandedRows(newExpanded);
  };

  const handleStatusUpdate = (complaintId: string, newStatus: string, remark: string) => {
    setStatusUpdates(prev => [...prev, { complaintId, newStatus, remark }]);
    // In a real app, this would make an API call
    console.log("Updating status:", { complaintId, newStatus, remark });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admin Analytics Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Comprehensive overview of complaint metrics, trends, and system performance.
          </p>
        </div>
        <button
          onClick={triggerWarningCheck}
          className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors shadow-card"
        >
          <RefreshCw className="h-4 w-4" />
          Run Warning Check
        </button>
      </div>

      {/* KPI Scorecards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-lg bg-primary/10">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <span className="text-sm font-medium text-green-600">{kpiData.totalComplaintsTrend || "0% this month"}</span>
          </div>
          <p className="mt-4 text-2xl font-bold text-foreground">{calculatedKPI.totalComplaints}</p>
          <p className="text-sm font-medium text-muted-foreground">Total Complaints</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-lg bg-blue-100">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-green-600">{kpiData.resolutionTimeTrend || "0 days"}</span>
          </div>
          <p className="mt-4 text-2xl font-bold text-foreground">{kpiData.avgResolutionTime} Days</p>
          <p className="text-sm font-medium text-muted-foreground">Avg Resolution Time</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-lg bg-amber-100">
              <TrendingUp className="h-6 w-6 text-amber-600" />
            </div>
            <span className="text-sm font-medium text-amber-600">Most reported</span>
          </div>
          <p className="mt-4 text-2xl font-bold text-foreground">{kpiData.mostReportedCategory}</p>
          <p className="text-sm font-medium text-muted-foreground">Top Category</p>
        </div>
      </div>

      {/* Warning Statistics */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Warning Statistics</h3>
          <AlertTriangle className="h-5 w-5 text-amber-500" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-amber-50 rounded-lg border border-amber-200">
            <p className="text-2xl font-bold text-amber-600">{warningStats.staleOpenComplaints}</p>
            <p className="text-sm text-amber-700">Stale Open (&gt;24h)</p>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
            <p className="text-2xl font-bold text-red-600">{warningStats.overdueComplaints}</p>
            <p className="text-sm text-red-700">Overdue (&gt;7 weeks)</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-2xl font-bold text-blue-600">{warningStats.unconfirmedResolutions}</p>
            <p className="text-sm text-blue-700">Unconfirmed</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
            <p className="text-2xl font-bold text-purple-600">{warningStats.totalWarningsNeeded}</p>
            <p className="text-sm text-purple-700">Total Warnings</p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart - Issues by Department */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Issues by Department</h2>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={departmentData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="department" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "8px" }}
              />
              <Bar dataKey="complaints" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Doughnut Chart - Status Distribution */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Status Distribution</h2>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Data Table */}
      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="p-6 border-b border-border">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-lg font-semibold text-foreground">All Complaints</h2>
            
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search complaints..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-3 py-2 border border-input rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              {/* Filters */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 border border-input rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="escalated">Escalated</option>
              </select>

              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="px-3 py-2 border border-input rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="all">All Departments</option>
                {departments.map(dept => (
                  <option key={dept.name} value={dept.name}>{dept.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Student Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedComplaints.map((complaint) => (
                <React.Fragment key={complaint.id}>
                  <tr className="hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-foreground">{complaint.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{complaint.studentName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{complaint.department.split(' ')[0]}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{complaint.category}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getPriorityColor(complaint.priority)}`}>
                        {complaint.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(complaint.status)}
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${getStatusColor(complaint.status)}`}>
                          {complaint.status.replace('-', ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{complaint.submittedDate}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleRowExpansion(complaint.id)}
                          className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="p-1 text-muted-foreground hover:text-foreground transition-colors">
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button className="p-1 text-muted-foreground hover:text-foreground transition-colors">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  
                  {/* Expandable Row for Staff Actions */}
                  {expandedRows.has(complaint.id) && (
                    <tr>
                      <td colSpan={8} className="px-6 py-4 bg-muted/10">
                        <div className="space-y-4">
                          <div className="flex items-start gap-3">
                            <MessageSquare className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div className="flex-1">
                              <p className="text-sm text-foreground font-medium mb-1">Description:</p>
                              <p className="text-sm text-muted-foreground">{complaint.description}</p>
                            </div>
                          </div>
                          
                          {/* Staff Update Section */}
                          <div className="border-t border-border pt-4">
                            <p className="text-sm font-medium text-foreground mb-3">Update Status & Add Remark</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs font-medium text-muted-foreground mb-1">New Status</label>
                                <select
                                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                  defaultValue={complaint.status}
                                >
                                  <option value="pending">Pending</option>
                                  <option value="in-progress">In Progress</option>
                                  <option value="resolved">Resolved</option>
                                  <option value="escalated">Escalated</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-muted-foreground mb-1">Remark</label>
                                <textarea
                                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                                  rows={2}
                                  placeholder="Add a remark about this update..."
                                />
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                const select = document.querySelector(`select[defaultValue="${complaint.status}"]`) as HTMLSelectElement;
                                const textarea = select?.parentElement?.nextElementSibling?.querySelector('textarea') as HTMLTextAreaElement;
                                if (select && textarea) {
                                  handleStatusUpdate(complaint.id, select.value, textarea.value);
                                  textarea.value = '';
                                }
                              }}
                              className="mt-3 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                            >
                              Update Status
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-border">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredComplaints.length)} of {filteredComplaints.length} results
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-input bg-background text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-3 py-1 text-sm font-medium text-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-input bg-background text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalyticsDashboard;
