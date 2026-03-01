import { FileText, Plus, Filter } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import api from "@/utils/api";

interface Complaint {
  id: string;
  title: string;
  status: string;
  date: string;
  category: string;
  priority: string;
}

const statusColor: Record<string, string> = {
  Pending: "bg-warning/15 text-warning",
  "In Progress": "bg-info/15 text-info",
  Resolved: "bg-success/15 text-success",
  Escalated: "bg-destructive/15 text-destructive",
};

const priorityColor: Record<string, string> = {
  High: "text-destructive",
  Medium: "text-warning",
  Low: "text-success",
};

const MyComplaints = () => {
  const { role } = useAuth();
  const { toast } = useToast();
  const isAdmin = role === 'admin';
  const isStaff = role === 'staff';
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch real complaints data
  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const response = await api.get('/complaints');
      const complaintsData = response.data.data.complaints || [];
      
      // Transform data to match interface
      const transformedComplaints = complaintsData.map((complaint: any) => ({
        id: complaint.id,
        title: complaint.title || complaint.description,
        status: complaint.status,
        date: new Date(complaint.createdAt).toLocaleDateString(),
        category: complaint.category,
        priority: complaint.priority
      }));
      
      setComplaints(transformedComplaints);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load complaints",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {isAdmin ? "All Complaints" : isStaff ? "Department Complaints" : "My Complaints"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isAdmin 
              ? "Track and manage all complaints in the system." 
              : isStaff 
                ? "View and manage complaints assigned to your department."
                : "Track and manage all your submitted complaints."
            }
          </p>
        </div>
        {/* Only students can create complaints */}
        {role === 'student' && (
          <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-card">
            <Plus className="h-4 w-4" /> New Complaint
          </button>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
        <div className="p-4 border-b border-border flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Showing {complaints.length} complaints</span>
        </div>
        <div className="divide-y divide-border">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Loading complaints...</div>
          ) : complaints.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No complaints found</div>
          ) : (
            complaints.map((c) => (
              <div key={c.id} className="p-5 hover:bg-muted/30 transition-colors cursor-pointer">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 p-2 rounded-lg bg-muted">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{c.title}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <span className="font-mono">{c.id}</span>
                        <span>·</span>
                        <span>{c.category}</span>
                        <span>·</span>
                        <span>{c.date}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-xs font-medium ${priorityColor[c.priority]}`}>{c.priority}</span>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor[c.status]}`}>{c.status}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default MyComplaints;
