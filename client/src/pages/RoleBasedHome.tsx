import { useAuth } from "@/hooks/useAuth";
import Index from "@/pages/Index";
import StaffDashboard from "@/pages/StaffDashboard";
import AdminDashboard from "@/pages/AdminDashboard";

const RoleBasedHome = () => {
  const { role } = useAuth();

  switch (role) {
    case "admin":
      return <AdminDashboard />;
    case "staff":
      return <StaffDashboard />;
    default:
      return <Index />;
  }
};

export default RoleBasedHome;
