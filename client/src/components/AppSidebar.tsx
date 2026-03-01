import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  FileText,
  Users,
  User,
  Settings,
  LogOut,
  Menu,
  Building,
  ChevronLeft,
  ChevronRight,
  Shield,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NavLink } from "@/components/ui/NavLink";
import { useAuth } from "@/hooks/useAuth";

const studentNav = [
  { title: "Home", url: "/", icon: Home },
  { title: "My Complaints", url: "/complaints", icon: FileText },
];

const staffNav = [
  { title: "Dashboard", url: "/", icon: Home },
];

const adminNav = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "All Complaints", url: "/complaints", icon: FileText },
  { title: "Staff Departments", url: "/staff", icon: Building },
  { title: "Staff Users", url: "/staff-users", icon: Users },
  { title: "Students", url: "/students", icon: User },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
];

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function AppSidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: AppSidebarProps) {
  const location = useLocation();
  const { role } = useAuth();

  const navItems = role === "admin" ? adminNav : role === "staff" ? staffNav : studentNav;

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-md lg:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-screen gradient-sidebar flex flex-col transition-all duration-300 ease-in-out border-r border-sidebar-border/20",
          collapsed ? "w-[68px]" : "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border/20">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full overflow-hidden shadow-lg">
            <img 
              src="/favicon/apple-touch-icon.png" 
              alt="ASTU Logo" 
              className="h-full w-full object-cover"
            />
          </div>
          {!collapsed && (
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-bold text-sidebar-primary tracking-tight">ASTU</span>
              <span className="text-[11px] text-sidebar-muted truncate">Complaint Tracker</span>
            </div>
          )}
        </div>

        {/* Role badge */}
        {!collapsed && role && (
          <div className="px-4 py-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-sidebar-accent/30 px-3 py-1.5 text-[10px] font-medium text-sidebar-muted uppercase tracking-wider border border-sidebar-accent/20">
              {role === "admin" && <Shield className="h-3 w-3" />}
              {role === "staff" && <Users className="h-3 w-3" />}
              {role === "student" && (
                <div className="h-3 w-3 rounded-full overflow-hidden">
                  <img 
                    src="/favicon/apple-touch-icon.png" 
                    alt="Student" 
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
              {role.replace("_", " ")}
            </span>
          </div>
        )}

        <nav className="flex-1 px-3 py-2 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.url;
            return (
              <NavLink
                key={item.url}
                to={item.url}
                onClick={onMobileClose}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm border border-sidebar-accent/50"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/20 hover:text-sidebar-accent-foreground"
                )}
              >
                <item.icon className={cn(
                  "h-[18px] w-[18px] shrink-0",
                  isActive && "text-sidebar-accent-foreground"
                )} />
                {!collapsed && <span>{item.title}</span>}
              </NavLink>
            );
          })}
        </nav>

        <button
          onClick={onToggle}
          className="hidden lg:flex items-center justify-center h-12 border-t border-sidebar-border/20 text-sidebar-muted hover:text-sidebar-primary transition-all duration-200 hover:bg-sidebar-accent/10"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </aside>
    </>
  );
}
