import { useState, useEffect } from 'react';
import { Building2, FileText, Clock, CheckCircle2, AlertCircle, User, Calendar, MessageSquare } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import api from '@/utils/api';

interface Complaint {
  id: string;
  body: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  createdAt: string;
  student: {
    id: string;
    fullName: string;
    email: string;
  };
  staffDepartment: {
    id: string;
    name: string;
  };
  resolver?: {
    id: string;
    fullName: string;
  };
}

const StaffDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [remark, setRemark] = useState('');

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const response = await api.get('/complaints');
      setComplaints(response.data.data.complaints);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch complaints',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const handleStatusUpdate = async (complaintId: string, newStatus: string) => {
    try {
      setUpdatingId(complaintId);
      await api.put(`/complaints/${complaintId}/status`, {
        status: newStatus,
        comment: remark
      });
      
      toast({
        title: 'Success',
        description: `Complaint status updated to ${newStatus.replace('_', ' ')}`,
      });
      
      fetchComplaints();
      setRemark('');
      setSelectedComplaint(null);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update complaint status',
        variant: 'destructive',
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <AlertCircle className="h-4 w-4 text-warning" />;
      case 'IN_PROGRESS':
        return <Clock className="h-4 w-4 text-info" />;
      case 'RESOLVED':
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'IN_PROGRESS':
        return 'bg-info/10 text-info border-info/20';
      case 'RESOLVED':
        return 'bg-success/10 text-success border-success/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  if (!user?.staffDepartment) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Department Not Assigned</h3>
          <p className="text-muted-foreground">
            You haven't been assigned to a department yet. Please contact an administrator.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {user.staffDepartment.name} Dashboard
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          View and manage complaints assigned to your department
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Total Assigned</span>
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <p className="mt-2 text-3xl font-bold text-foreground">{complaints.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Open</span>
            <AlertCircle className="h-5 w-5 text-warning" />
          </div>
          <p className="mt-2 text-3xl font-bold text-foreground">
            {complaints.filter(c => c.status === 'OPEN').length}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">In Progress</span>
            <Clock className="h-5 w-5 text-info" />
          </div>
          <p className="mt-2 text-3xl font-bold text-foreground">
            {complaints.filter(c => c.status === 'IN_PROGRESS').length}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Resolved</span>
            <CheckCircle2 className="h-5 w-5 text-success" />
          </div>
          <p className="mt-2 text-3xl font-bold text-foreground">
            {complaints.filter(c => c.status === 'RESOLVED').length}
          </p>
        </div>
      </div>

      {/* Complaints Table */}
      <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
        <div className="p-6 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Assigned Complaints</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Click on any complaint to update status and add remarks
          </p>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Complaint
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {complaints.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No complaints assigned to your department</p>
                    </td>
                  </tr>
                ) : (
                  complaints.map((complaint) => (
                    <tr 
                      key={complaint.id} 
                      className="hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => setSelectedComplaint(complaint)}
                    >
                      <td className="px-6 py-4">
                        <div className="max-w-md">
                          <p className="text-sm text-foreground line-clamp-2">
                            {complaint.body}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <User className="h-4 w-4 text-muted-foreground mr-2" />
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {complaint.student.fullName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {complaint.student.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(complaint.status)}`}>
                          {getStatusIcon(complaint.status)}
                          <span className="ml-1">{complaint.status.replace('_', ' ')}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(complaint.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          {complaint.status === 'OPEN' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedComplaint(complaint);
                              }}
                              className="inline-flex items-center px-3 py-1 border border-info text-info text-xs font-medium rounded-md hover:bg-info/10 focus:outline-none focus:ring-2 focus:ring-info/50"
                            >
                              <Clock className="h-3 w-3 mr-1" />
                              Start Work
                            </button>
                          )}
                          {complaint.status === 'IN_PROGRESS' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedComplaint(complaint);
                              }}
                              className="inline-flex items-center px-3 py-1 border border-success text-success text-xs font-medium rounded-md hover:bg-success/10 focus:outline-none focus:ring-2 focus:ring-success/50"
                            >
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Resolve
                            </button>
                          )}
                          {complaint.status === 'RESOLVED' && (
                            <span className="text-xs text-success font-medium">Completed</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Update Status Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-md">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Update Complaint Status
            </h3>
            
            <div className="mb-4">
              <p className="text-sm text-muted-foreground mb-2">Complaint:</p>
              <p className="text-sm text-foreground bg-muted p-3 rounded">
                {selectedComplaint.body}
              </p>
            </div>

            <div className="mb-4">
              <p className="text-sm text-muted-foreground mb-2">From:</p>
              <p className="text-sm text-foreground">
                {selectedComplaint.student.fullName} ({selectedComplaint.student.email})
              </p>
            </div>

            <div className="mb-4">
              <label className="text-sm font-medium text-foreground mb-2 block">
                Add Remarks (Optional)
              </label>
              <textarea
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                placeholder="Add any notes about this complaint..."
                className="w-full h-20 rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30"
              />
            </div>

            <div className="flex space-x-3">
              {selectedComplaint.status === 'OPEN' && (
                <button
                  onClick={() => handleStatusUpdate(selectedComplaint.id, 'IN_PROGRESS')}
                  disabled={updatingId === selectedComplaint.id}
                  className="flex-1 bg-info text-info-foreground px-4 py-2 rounded-lg hover:bg-info/90 transition-colors disabled:opacity-50"
                >
                  {updatingId === selectedComplaint.id ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mx-auto"></div>
                  ) : (
                    'Start Work'
                  )}
                </button>
              )}
              {selectedComplaint.status === 'IN_PROGRESS' && (
                <button
                  onClick={() => handleStatusUpdate(selectedComplaint.id, 'RESOLVED')}
                  disabled={updatingId === selectedComplaint.id}
                  className="flex-1 bg-success text-success-foreground px-4 py-2 rounded-lg hover:bg-success/90 transition-colors disabled:opacity-50"
                >
                  {updatingId === selectedComplaint.id ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mx-auto"></div>
                  ) : (
                    'Mark Resolved'
                  )}
                </button>
              )}
              <button
                onClick={() => {
                  setSelectedComplaint(null);
                  setRemark('');
                }}
                className="flex-1 bg-muted text-muted-foreground px-4 py-2 rounded-lg hover:bg-muted/80 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffDashboard;
