import { useState, useEffect } from "react";
import { Building, Plus, Edit3, Trash2, Search, Filter, Users, Mail, Phone, Calendar, Shield, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import api from "@/utils/api";

interface StaffDepartment {
  id: string;
  name: string;
  description?: string;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone?: string;
  department: string;
  role: string;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}

interface DepartmentFormData {
  name: string;
  description: string;
}

const StaffManagement = () => {
  const { toast } = useToast();
  const [departments, setDepartments] = useState<StaffDepartment[]>([]);
  const [departmentMembers, setDepartmentMembers] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showMembersDialog, setShowMembersDialog] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<StaffDepartment | null>(null);
  const [formData, setFormData] = useState<DepartmentFormData>({
    name: "",
    description: ""
  });

  // Fetch departments data
  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/staff/departments');
      setDepartments(response.data.data.departments || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load departments",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch department members
  const fetchDepartmentMembers = async (departmentId: string) => {
    try {
      setLoadingMembers(true);
      const response = await api.get(`/admin/staff/departments/${departmentId}/members`);
      setDepartmentMembers(response.data.data.members || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load department members",
        variant: "destructive"
      });
    } finally {
      setLoadingMembers(false);
    }
  };

  // Filter departments based on search
  const filteredDepartments = departments.filter(dept => 
    dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (dept.description && dept.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (showEditDialog && selectedDepartment) {
        // Update existing department
        await api.put(`/admin/staff/departments/${selectedDepartment.id}`, formData);
        toast({
          title: "Success",
          description: "Department updated successfully",
        });
      } else {
        // Add new department
        await api.post('/admin/staff/departments', formData);
        toast({
          title: "Success",
          description: "Department created successfully",
        });
      }
      
      // Reset form and refresh data
      resetForm();
      fetchDepartments();
    } catch (error) {
      toast({
        title: "Error",
        description: showEditDialog ? "Failed to update department" : "Failed to create department",
        variant: "destructive"
      });
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this department? This will also affect all staff members in this department.")) return;
    
    try {
      await api.delete(`/admin/staff/departments/${id}`);
      toast({
        title: "Success",
        description: "Department deleted successfully",
      });
      fetchDepartments();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete department",
        variant: "destructive"
      });
    }
  };

  // Handle view members
  const handleViewMembers = (department: StaffDepartment) => {
    setSelectedDepartment(department);
    setShowMembersDialog(true);
    fetchDepartmentMembers(department.id);
  };

  // Handle edit
  const handleEdit = (department: StaffDepartment) => {
    setSelectedDepartment(department);
    setFormData({
      name: department.name,
      description: department.description || ""
    });
    setShowEditDialog(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      description: ""
    });
    setSelectedDepartment(null);
    setShowAddDialog(false);
    setShowEditDialog(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Staff Departments</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage staff departments and their members
          </p>
        </div>
        <button
          onClick={() => setShowAddDialog(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors shadow-card"
        >
          <Plus className="h-4 w-4" />
          Add Department
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search departments by name or description..."
          className="w-full pl-9 pr-3 py-2 border border-input rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
      </div>

      {/* Departments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full p-8 text-center text-muted-foreground">Loading departments...</div>
        ) : filteredDepartments.length === 0 ? (
          <div className="col-span-full p-8 text-center text-muted-foreground">No departments found</div>
        ) : (
          filteredDepartments.map((department) => (
            <div key={department.id} className="rounded-xl border border-border bg-card p-6 shadow-card hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{department.name}</h3>
                    <p className="text-sm text-muted-foreground">Department</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleViewMembers(department)}
                    className="p-1.5 rounded hover:bg-muted transition-colors"
                    title="View members"
                  >
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </button>
                  <button
                    onClick={() => handleEdit(department)}
                    className="p-1.5 rounded hover:bg-muted transition-colors"
                    title="Edit department"
                  >
                    <Edit3 className="h-4 w-4 text-muted-foreground" />
                  </button>
                  <button
                    onClick={() => handleDelete(department.id)}
                    className="p-1.5 rounded hover:bg-muted transition-colors"
                    title="Delete department"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </button>
                </div>
              </div>
              
              {department.description && (
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {department.description}
                </p>
              )}
              
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Users className="h-3 w-3" />
                  <span>{department.memberCount} members</span>
                </div>
                <div className="text-muted-foreground">
                  Created {new Date(department.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Department Dialog */}
      {(showAddDialog || showEditDialog) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h3 className="text-lg font-semibold">
                {showEditDialog ? "Edit Department" : "Add New Department"}
              </h3>
              <button
                onClick={resetForm}
                className="p-1 rounded hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Department Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Enter department name"
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Enter department description"
                  rows={3}
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                />
              </div>
              
              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
                >
                  {showEditDialog ? "Update Department" : "Add Department"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Department Members Dialog */}
      {showMembersDialog && selectedDepartment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-4xl mx-4 max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div>
                <h3 className="text-lg font-semibold">{selectedDepartment.name} Members</h3>
                <p className="text-sm text-muted-foreground">
                  {departmentMembers.length} staff members
                </p>
              </div>
              <button
                onClick={() => {
                  setShowMembersDialog(false);
                  setSelectedDepartment(null);
                  setDepartmentMembers([]);
                }}
                className="p-1 rounded hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {loadingMembers ? (
                <div className="text-center text-muted-foreground py-8">Loading members...</div>
              ) : departmentMembers.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">No staff members found in this department</div>
              ) : (
                <div className="space-y-3">
                  {departmentMembers.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{member.name}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{member.email}</span>
                            {member.phone && <span>• {member.phone}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                          {member.role}
                        </span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          member.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {member.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffManagement;
