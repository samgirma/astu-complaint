import { useState, useRef, useEffect } from "react";
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Upload,
  X,
  Camera,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import api from "@/utils/api";
import FloatingAIAssistant from "@/components/FloatingAIAssistant";

interface StatCard {
  title: string;
  value: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  change: string;
  changeType: "increase" | "decrease";
}

interface ComplaintForm {
  title: string;
  departmentId: string;
  description: string;
  files: File[];
}

interface Complaint {
  id: string;
  body: string;
  status: string;
  issueDate: string;
  staffDepartment: {
    name: string;
  };
  student: {
    fullName: string;
  };
}

const StudentDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [complaintForm, setComplaintForm] = useState<ComplaintForm>({
    title: "",
    departmentId: "",
    description: "",
    files: []
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Real data state
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [departmentsList, setDepartmentsList] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Fetch real data from API
  useEffect(() => {
    fetchStudentData();
  }, []);

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      
      // Fetch complaints data
      const complaintsResponse = await api.get('/complaints');
      setComplaints(complaintsResponse.data.data.complaints || []);
      
      // Get department ID from selected category
      const selectedDept = departmentsList.find(dept => 
        dept.name.toLowerCase().includes(complaintForm.category.toLowerCase())
      );
      // Fetch departments data
      const departmentsResponse = await api.get('/complaints/departments');
      setDepartmentsList(departmentsResponse.data.data.departments || []);
      
      // Fetch stats data
      const statsResponse = await api.get('/complaints/stats');
      setStats(statsResponse.data.data.stats || {});
      
    } catch (error) {
      console.error('Failed to fetch student data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate stat cards from real data
  const statCards: StatCard[] = [
    {
      title: "Open Tickets",
      value: stats?.openComplaints?.toString() || "0",
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      change: "+0 this week",
      changeType: "increase"
    },
    {
      title: "Resolved",
      value: stats?.resolvedComplaints?.toString() || "0",
      icon: CheckCircle2,
      color: "text-green-600",
      bgColor: "bg-green-50",
      change: "+0 this week",
      changeType: "increase"
    },
    {
      title: "Pending Action",
      value: stats?.inProgressComplaints?.toString() || "0",
      icon: Clock,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      change: "+0 this week",
      changeType: "decrease"
    }
  ];

  const handleFileUpload = (files: FileList | null) => {
    if (files) {
      const newFiles = Array.from(files).slice(0, 5); // Limit to 5 files
      setComplaintForm(prev => ({
        ...prev,
        files: [...prev.files, ...newFiles].slice(0, 5) // Keep max 5 files
      }));
    }
  };

  const removeFile = (index: number) => {
    setComplaintForm(prev => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index)
    }));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!complaintForm.title.trim() || !complaintForm.description.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    
    if (!complaintForm.departmentId) {
      toast({
        title: "Error", 
        description: "Please select a department",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('body', complaintForm.description);
      formData.append('staffDeptId', complaintForm.departmentId);
      
      // Add files if any
      complaintForm.files.forEach((file) => {
        formData.append('files', file);
      });
      
      const response = await api.post('/complaints', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (response.data.success) {
        toast({
          title: "Success",
          description: "Complaint submitted successfully",
        });
        
        // Reset form
        setComplaintForm({
          title: "",
          departmentId: "",
          description: "",
          files: []
        });
        
        // Refresh complaints list
        fetchStudentData();
      } else {
        toast({
          title: "Error",
          description: response.data.message || "Failed to submit complaint",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Complaint submission error:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to submit complaint",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Student Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your complaints and get assistance from our AI assistant.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statCards.map((stat) => (
          <div key={stat.title} className="rounded-xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <span className={`text-xs font-medium ${
                stat.changeType === "increase" ? "text-green-600" : "text-amber-600"
              }`}>
                {stat.change}
              </span>
            </div>
            <p className="mt-4 text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="mt-1 text-sm font-medium text-muted-foreground">{stat.title}</p>
          </div>
        ))}
      </div>

      {/* Complaint Form */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-foreground mb-4">Submit New Complaint</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Title
            </label>
            <input
              type="text"
              value={complaintForm.title}
              onChange={(e) => setComplaintForm(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              placeholder="Brief description of your complaint"
              required
            />
          </div>

          {/* Department Selection */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Department
            </label>
            <select
              value={complaintForm.departmentId}
              onChange={(e) => setComplaintForm(prev => ({ ...prev, departmentId: e.target.value }))}
              className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              required
            >
              <option value="">Select a department...</option>
              {departmentsList.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
            {departmentsList.length === 0 && (
              <p className="text-xs text-muted-foreground mt-1">Loading departments...</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Description
            </label>
            <textarea
              value={complaintForm.description}
              onChange={(e) => setComplaintForm(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none"
              rows={4}
              placeholder="Provide detailed information about your complaint..."
              required
            />
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Attachments (Max 5 files)
            </label>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-border bg-muted/20 hover:bg-muted/30"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx"
                onChange={(e) => handleFileUpload(e.target.files)}
                className="hidden"
              />
              <Camera className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Drag & drop files here or click to browse
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Supports: Images, PDFs, Documents (Max 5MB each)
              </p>
            </div>

            {/* File List */}
            {complaintForm.files.length > 0 && (
              <div className="mt-3 space-y-2">
                {complaintForm.files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                    <span className="text-sm text-foreground truncate flex-1">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="ml-2 p-1 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-lg font-medium hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
          >
            {submitting ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
                Submitting...
              </div>
            ) : (
              "Submit Complaint"
            )}
          </button>
        </form>
      </div>

      {/* Complaints List */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-foreground mb-4">Your Complaints</h2>
        
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading complaints...</div>
        ) : complaints.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
            <p>No complaints submitted yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {complaints.map((complaint) => (
              <div key={complaint.id} className="border border-border rounded-lg p-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground mb-1">{complaint.body}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Department: {complaint.staffDepartment?.name}</span>
                      <span>Date: {new Date(complaint.issueDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    complaint.status === 'RESOLVED' 
                      ? 'bg-green-100 text-green-800'
                      : complaint.status === 'IN_PROGRESS'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {complaint.status.replace('_', ' ')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    
    <FloatingAIAssistant />
    </>
  );
};

export default StudentDashboard;
