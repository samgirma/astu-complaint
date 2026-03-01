import { useState } from "react";
import { Outlet } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
import { TopNavbar } from "@/components/TopNavbar";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { cn } from "@/lib/utils";

export function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <NotificationProvider>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <AppSidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed(!collapsed)}
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
        />

        <div
          className={cn(
            "flex flex-col min-h-screen transition-all duration-300 ease-in-out",
            collapsed ? "lg:ml-[68px]" : "lg:ml-64"
          )}
        >
          <TopNavbar onMenuClick={() => setMobileOpen(true)} />
          <main className="flex-1 p-4 lg:p-6 bg-background/50">
            <div className="max-w-7xl mx-auto">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </NotificationProvider>
  );
}
