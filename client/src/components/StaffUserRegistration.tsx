import { useState, useEffect } from "react";
import { Users, Plus, Edit3, Trash2, Search, Building, Mail, Phone, Shield, X, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNotification } from "@/contexts/NotificationContext";
import api from "@/utils/api";

interface StaffUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  department: string;
  departmentId: string;
  role: string;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}

interface StaffDepartment {
  id: string;
  name: string;
  description?: string;
  memberCount: number;
}

interface StaffFormData {
  name: string;
  email: string;
  phone: string;
  departmentId: string;
  role: string;
  status: "active" | "inactive";
  generatedPassword?: string;
}

const StaffUserRegistration = () => {
  const { toast } = useToast();
  const { addNotification } = useNotification();
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>([]);
  const [departments, setDepartments] = useState<StaffDepartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffUser | null>(null);
  const [formData, setFormData] = useState<StaffFormData>({
    name: "",
    email: "",
    phone: "",
    departmentId: "",
    role: "staff",
    status: "active",
    generatedPassword: ""
  });

  // Fetch data
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch staff users
      const staffResponse = await api.get('/admin/staff-users');
      setStaffUsers(staffResponse.data.data.staffUsers || []);
      
      // Fetch departments
      const deptResponse = await api.get('/admin/staff/departments');
      setDepartments(deptResponse.data.data.departments || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter staff users
  const filteredStaffUsers = staffUsers.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = selectedDepartment === "all" || user.departmentId === selectedDepartment;
    return matchesSearch && matchesDepartment;
  });

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate email format (same as student validation)
    const astuPattern = /^[a-zA-Z]+\.[a-zA-Z]+@(astu|astust)\.edu\.et$/;
    if (!astuPattern.test(formData.email)) {
      toast({
        title: "Error",
        description: "Email must be in format: first.last@astu.edu.et or first.last@astust.edu.et",
        variant: "destructive"
      });
      return;
    }
    
    try {
      if (showEditDialog && selectedStaff) {
        // Update existing staff user
        await api.put(`/admin/staff-users/${selectedStaff.id}`, {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          departmentId: formData.departmentId,
          role: formData.role,
          status: formData.status
        });
        toast({
          title: "Success",
          description: "Staff user updated successfully",
        });
      } else {
        // Create new staff user
        const response = await api.post('/admin/staff-users', {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          departmentId: formData.departmentId,
          role: formData.role,
          status: formData.status
        });
        
        // Show the generated password to admin
        const temporaryPassword = response.data.data.temporaryPassword;
        
        // Add real-time notification
        addNotification({
          id: Date.now().toString(), // Temporary ID, will be replaced by server
          type: 'ADMIN_WARNING',
          title: 'Staff User Created Successfully',
          message: `New staff user ${formData.name} has been created. Email: ${formData.email}, Temporary Password: ${temporaryPassword}. Please share these credentials with the staff member.`,
          isRead: false,
          createdAt: new Date().toISOString()
        });
        
        toast({
          title: "Staff User Created Successfully",
          description: `Temporary password: ${temporaryPassword}. Please share this with the staff member.`,
          duration: 10000 // Show for 10 seconds
        });
      }
      
      fetchData();
      resetForm();
    } catch (error: any) {
      console.error('Error saving staff user:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to save staff user",
        variant: "destructive"
      });
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this staff user? This action cannot be undone.")) return;
    
    try {
      await api.delete(`/admin/staff-users/${id}`);
      toast({
        title: "Success",
        description: "Staff user deleted successfully",
      });
      fetchData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete staff user",
        variant: "destructive"
      });
    }
  };

  // Handle edit
  const handleEdit = (staffUser: StaffUser) => {
    setSelectedStaff(staffUser);
    setFormData({
      name: staffUser.name,
      email: staffUser.email,
      phone: staffUser.phone || "",
      departmentId: staffUser.departmentId,
      role: staffUser.role,
      status: staffUser.status,
      generatedPassword: ""
    });
    setShowEditDialog(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      departmentId: "",
      role: "staff",
      status: "active",
      generatedPassword: ""
    });
    setSelectedStaff(null);
    setShowAddDialog(false);
    setShowEditDialog(false);
  };

  const statusColor = {
    active: "bg-green-100 text-green-800",
    inactive: "bg-red-100 text-red-800"
  };

  const roleColor = {
    staff: "bg-blue-100 text-blue-800",
    department_head: "bg-purple-100 text-purple-800",
    supervisor: "bg-orange-100 text-orange-800"
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Staff User Registration</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Register and manage staff user accounts
          </p>
        </div>
        <button
          onClick={() => setShowAddDialog(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors shadow-card"
        >
          <UserPlus className="h-4 w-4" />
          Register Staff
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search staff users by name, email, or department..."
            className="w-full pl-9 pr-3 py-2 border border-input rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
        <select
          value={selectedDepartment}
          onChange={(e) => setSelectedDepartment(e.target.value)}
          className="px-3 py-2 border border-input rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        >
          <option value="all">All Departments</option>
          {departments.map(dept => (
            <option key={dept.id} value={dept.id}>{dept.name}</option>
          ))}
        </select>
      </div>

      {/* Staff Users Table */}
      <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
        <div className="p-4 border-b border-border flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Showing {filteredStaffUsers.length} staff users</span>
        </div>
        
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading staff users...</div>
        ) : filteredStaffUsers.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No staff users found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 font-medium text-sm">Staff User</th>
                  <th className="text-left p-4 font-medium text-sm">Contact</th>
                  <th className="text-left p-4 font-medium text-sm">Department</th>
                  <th className="text-left p-4 font-medium text-sm">Role</th>
                  <th className="text-left p-4 font-medium text-sm">Status</th>
                  <th className="text-left p-4 font-medium text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStaffUsers.map((user) => (
                  <tr key={user.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{user.name}</p>
                          <p className="text-sm text-muted-foreground">ID: {user.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          <span>{user.email}</span>
                        </div>
                        {user.phone && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            <span>{user.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Building className="h-3 w-3 text-muted-foreground" />
                        <span>{user.department}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${roleColor[user.role] || 'bg-gray-100 text-gray-800'}`}>
                        <Shield className="h-3 w-3 mr-1" />
                        {user.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusColor[user.status]}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className="p-1 rounded hover:bg-muted transition-colors"
                        >
                          <Edit3 className="h-4 w-4 text-muted-foreground" />
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="p-1 rounded hover:bg-muted transition-colors"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Staff User Dialog */}
      {(showAddDialog || showEditDialog) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-border flex-shrink-0">
              <h3 className="text-lg font-semibold">
                {showEditDialog ? "Edit Staff User" : "Register New Staff User"}
              </h3>
              <button
                onClick={resetForm}
                className="p-1 rounded hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Enter full name"
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="Enter email address"
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Phone (Optional)</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="Enter phone number"
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Department</label>
                <select
                  value={formData.departmentId}
                  onChange={(e) => setFormData({...formData, departmentId: e.target.value})}
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  required
                >
                  <option value="">Select department</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  required
                >
                  <option value="staff">Staff</option>
                  <option value="department_head">Department Head</option>
                  <option value="supervisor">Supervisor</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value as "active" | "inactive"})}
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  required
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              
              {!showEditDialog && (
                <div className="bg-muted/50 p-4 rounded-lg border border-muted">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Temporary Password
                      </label>
                      <p className="text-xs text-muted-foreground">
                        A secure password will be automatically generated when you create the staff user
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">Auto-Generated</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-end gap-3 pt-4 flex-shrink-0">
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
                  {showEditDialog ? "Update Staff User" : "Register Staff User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffUserRegistration;
