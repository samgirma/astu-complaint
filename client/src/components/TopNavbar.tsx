import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Menu, ChevronDown, User, Settings, LogOut, Bell, X, Clock, CheckCircle, AlertCircle, Info } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNotification } from "@/contexts/NotificationContext";
import { cn } from "@/lib/utils";

interface TopNavbarProps {
  onMenuClick: () => void;
}

export function TopNavbar({ onMenuClick }: TopNavbarProps) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<any>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user, role, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotification();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleNotificationClick = async (notification: any) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
    setSelectedNotification(notification);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'COMPLAINT_ASSIGNED':
      case 'COMPLAINT_UPDATED':
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
      case 'COMPLAINT_RESOLVED':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'COMPLAINT_ESCALATED':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case 'ADMIN_WARNING':
        return <Info className="h-4 w-4 text-red-500" />;
      default:
        return <Bell className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const initials = user?.fullName
    ? user.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "U";

  const roleLabel = role === "staff" ? "Department Staff" : role === "admin" ? "Administrator" : "Student";

  // Sort notifications: unread first, then by time (newest first)
  const sortedNotifications = (notifications || []).sort((a, b) => {
    if (a.isRead !== b.isRead) return a.isRead ? 1 : -1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <>
      <header className="sticky top-0 z-30 h-16 bg-card/95 backdrop-blur-sm border-b border-border flex items-center justify-between px-4 lg:px-6 shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search complaints, users, or analytics..."
              className="h-10 w-64 lg:w-80 rounded-lg border border-input bg-background/50 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative" ref={notificationsRef}>
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-muted transition-colors group relative"
            >
              <Bell className="h-5 w-5 text-muted-foreground" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-destructive text-destructive-foreground rounded-full text-xs font-bold flex items-center justify-center">
                  {(unreadCount || 0) > 99 ? '99+' : (unreadCount || 0)}
                </span>
              )}
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 rounded-lg border border-border bg-card/95 backdrop-blur-sm shadow-lg py-1 animate-in fade-in-0 zoom-in-95 duration-150">
                <div className="flex items-center justify-between p-3 border-b border-border">
                  <h3 className="font-semibold text-foreground">Notifications</h3>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-xs text-primary hover:underline"
                      >
                        Mark all read
                      </button>
                    )}
                    <button
                      onClick={() => setNotificationsOpen(false)}
                      className="p-1 rounded hover:bg-muted transition-colors"
                    >
                      <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </div>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {sortedNotifications.length === 0 ? (
                    <p className="text-sm text-muted-foreground p-3">No notifications</p>
                  ) : (
                    sortedNotifications.map((notification) => (
                      <div
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        className={cn(
                          "flex items-start gap-3 p-3 hover:bg-muted cursor-pointer transition-colors",
                          !notification.isRead && "bg-primary/5 border-l-2 border-primary"
                        )}
                      >
                        <div className="flex-shrink-0 mt-0.5">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            "text-sm text-foreground line-clamp-1",
                            !notification.isRead && "font-semibold"
                          )}>
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {formatTime(notification.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-muted transition-colors group"
            >
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all overflow-hidden">
                {user?.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-semibold text-primary-foreground">{initials}</span>
                )}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-semibold text-foreground leading-none">
                  {user?.fullName || "User"}
                </p>
                <p className="text-xs text-muted-foreground capitalize">{roleLabel}</p>
              </div>
              <ChevronDown className="hidden md:block h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-lg border border-border bg-card/95 backdrop-blur-sm shadow-lg py-1 animate-in fade-in-0 zoom-in-95 duration-150">
                <button
                  onClick={() => {
                    navigate('/profile');
                    setProfileOpen(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                >
                  <User className="h-4 w-4 text-muted-foreground" /> Profile
                </button>
                <div className="border-t border-border my-1" />
                <button
                  onClick={() => {
                    navigate('/settings');
                    setProfileOpen(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                >
                  <Settings className="h-4 w-4 text-muted-foreground" /> Settings
                </button>
                <div className="border-t border-border my-1" />
                <button
                  onClick={() => {
                    logout();
                    setProfileOpen(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-muted transition-colors"
                >
                  <LogOut className="h-4 w-4" /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Notification Modal */}
      {selectedNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-lg shadow-lg max-w-md w-full mx-4 animate-in fade-in-0 zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                {getNotificationIcon(selectedNotification.type)}
                <h3 className="font-semibold text-foreground">Notification</h3>
              </div>
              <button
                onClick={() => setSelectedNotification(null)}
                className="p-1 rounded hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
            <div className="p-4">
              <p className="text-sm text-foreground mb-3">{selectedNotification.message}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{new Date(selectedNotification.createdAt).toLocaleString()}</span>
              </div>
              {selectedNotification.fromUser && (
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-xs text-muted-foreground">
                    From: {selectedNotification.fromUser.fullName} ({selectedNotification.fromUser.role})
                  </p>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 p-4 border-t border-border">
              <button
                onClick={() => setSelectedNotification(null)}
                className="px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted rounded transition-colors"
              >
                Close
              </button>
              {selectedNotification.complaintId && (
                <button
                  onClick={() => {
                    navigate(`/complaints/${selectedNotification.complaintId}`);
                    setSelectedNotification(null);
                  }}
                  className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
                >
                  View Complaint
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
