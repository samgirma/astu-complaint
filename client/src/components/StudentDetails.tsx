import { useState, useEffect } from "react";
import { X, Mail, Phone, Calendar, FileText, Clock, CheckCircle, AlertCircle, TrendingUp, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import api from "@/utils/api";

interface StudentDetails {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  profilePicture?: string;
  createdComplaints: Array<{
    id: string;
    body: string;
    status: string;
    issueDate: string;
    resolvedAt?: string;
    staffDepartment: {
      name: string;
    };
  }>;
  analytics: {
    totalComplaints: number;
    resolvedComplaints: number;
    pendingComplaints: number;
    inProgressComplaints: number;
    averageResolutionTime: number;
    mostActiveDepartment: string | null;
    recentActivity: any[];
  };
}

interface StudentDetailsModalProps {
  studentId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function StudentDetailsModal({ studentId, isOpen, onClose }: StudentDetailsModalProps) {
  const [student, setStudent] = useState<StudentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && studentId) {
      fetchStudentDetails();
    }
  }, [isOpen, studentId]);

  const fetchStudentDetails = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/admin/students/${studentId}`);
      if (response.data.success) {
        setStudent(response.data.data.student);
      }
    } catch (error) {
      console.error('Fetch student details error:', error);
      toast({
        title: "Error",
        description: "Failed to fetch student details",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RESOLVED':
        return 'bg-green-100 text-green-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'OPEN':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-card rounded-xl shadow-xl border border-border max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">Student Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : student ? (
            <div className="space-y-6">
              {/* Student Info */}
              <div className="flex items-start gap-6">
                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {student.profilePicture ? (
                    <img
                      src={student.profilePicture}
                      alt={student.fullName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-xl font-semibold text-primary-foreground">
                      {student.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </span>
                  )}
                </div>
                
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-foreground mb-2">{student.fullName}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-foreground">{student.email}</span>
                    </div>
                    {student.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-foreground">{student.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-foreground">Joined: {formatDate(student.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        student.status === 'active' ? 'bg-green-100 text-green-800' :
                        student.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {student.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Analytics Overview */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-muted/30 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-foreground">{student.analytics.totalComplaints}</div>
                  <div className="text-sm text-muted-foreground">Total Complaints</div>
                </div>
                <div className="bg-muted/30 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{student.analytics.resolvedComplaints}</div>
                  <div className="text-sm text-muted-foreground">Resolved</div>
                </div>
                <div className="bg-muted/30 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-600">{student.analytics.pendingComplaints}</div>
                  <div className="text-sm text-muted-foreground">Pending</div>
                </div>
                <div className="bg-muted/30 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{student.analytics.averageResolutionTime}d</div>
                  <div className="text-sm text-muted-foreground">Avg Resolution</div>
                </div>
              </div>

              {/* Recent Complaints */}
              <div>
                <h4 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Recent Complaints ({student.createdComplaints.length})
                </h4>
                
                {student.createdComplaints.length > 0 ? (
                  <div className="space-y-3">
                    {student.createdComplaints.slice(0, 5).map((complaint) => (
                      <div key={complaint.id} className="bg-muted/30 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm text-foreground mb-2">{complaint.body}</p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>Department: {complaint.staffDepartment.name}</span>
                              <span>Filed: {formatDate(complaint.issueDate)}</span>
                              {complaint.resolvedAt && (
                                <span>Resolved: {formatDate(complaint.resolvedAt)}</span>
                              )}
                            </div>
                          </div>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(complaint.status)}`}>
                            {complaint.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-2" />
                    <p>No complaints filed</p>
                  </div>
                )}
              </div>

              {/* Additional Analytics */}
              {student.analytics.mostActiveDepartment && (
                <div className="bg-muted/30 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Most Active Department
                  </h4>
                  <p className="text-foreground">{student.analytics.mostActiveDepartment}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Student not found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
