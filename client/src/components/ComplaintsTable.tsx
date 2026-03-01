import { useState, useEffect } from 'react';
import { FileText, Clock, CheckCircle2, AlertCircle, User, Calendar, MessageSquare } from 'lucide-react';
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

interface ComplaintsTableProps {
  onComplaintUpdate?: () => void;
}

const ComplaintsTable = ({ onComplaintUpdate }: ComplaintsTableProps) => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const { toast } = useToast();

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

  const handleStatusUpdate = async (complaintId: string, newStatus: string, comment?: string) => {
    try {
      setUpdatingId(complaintId);
      await api.put(`/complaints/${complaintId}/status`, {
        status: newStatus,
        comment: comment || ''
      });
      
      toast({
        title: 'Success',
        description: `Complaint status updated to ${newStatus.replace('_', ' ')}`,
      });
      
      fetchComplaints();
      onComplaintUpdate?.();
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
      <div className="p-6 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground">Department Complaints</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Manage complaints assigned to your department
        </p>
      </div>
      
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
                <tr key={complaint.id} className="hover:bg-muted/50 transition-colors">
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
                          onClick={() => handleStatusUpdate(complaint.id, 'IN_PROGRESS')}
                          disabled={updatingId === complaint.id}
                          className="inline-flex items-center px-3 py-1 border border-info text-info text-xs font-medium rounded-md hover:bg-info/10 focus:outline-none focus:ring-2 focus:ring-info/50 disabled:opacity-50"
                        >
                          {updatingId === complaint.id ? (
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-info mr-1"></div>
                          ) : (
                            <Clock className="h-3 w-3 mr-1" />
                          )}
                          Start
                        </button>
                      )}
                      {complaint.status === 'IN_PROGRESS' && (
                        <button
                          onClick={() => handleStatusUpdate(complaint.id, 'RESOLVED')}
                          disabled={updatingId === complaint.id}
                          className="inline-flex items-center px-3 py-1 border border-success text-success text-xs font-medium rounded-md hover:bg-success/10 focus:outline-none focus:ring-2 focus:ring-success/50 disabled:opacity-50"
                        >
                          {updatingId === complaint.id ? (
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-success mr-1"></div>
                          ) : (
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                          )}
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
    </div>
  );
};

export default ComplaintsTable;
