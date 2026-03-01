import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { Bell, X, AlertTriangle, CheckCircle, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import api from "@/utils/api";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "warning" | "info" | "success" | "error";
  timestamp: Date;
  read: boolean;
  targetRole?: "staff" | "admin" | "all";
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, "id" | "timestamp" | "read">) => void;
  markAsRead: (id: string) => void;
  clearNotifications: () => void;
  sendWarningToStaff: (title: string, message: string, targetStaff?: string) => void;
  unreadCount: number;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  // Load notifications on mount
  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications');
      const notificationData = response.data.data.notifications || [];
      
      const transformedNotifications = notificationData.map((notif: any) => ({
        id: notif.id,
        title: notif.title,
        message: notif.message,
        type: notif.type || 'info',
        timestamp: new Date(notif.createdAt),
        read: notif.read || false,
        targetRole: notif.targetRole || 'all'
      }));
      
      setNotifications(transformedNotifications);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const addNotification = (notification: Omit<Notification, "id" | "timestamp" | "read">) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false,
    };

    setNotifications(prev => [newNotification, ...prev]);

    // Show toast for new notification
    toast({
      title: notification.title,
      description: notification.message,
      variant: notification.type === "error" ? "destructive" : "default",
    });
  };

  const markAsRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === id ? { ...notif, read: true } : notif
        )
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const sendWarningToStaff = async (title: string, message: string, targetStaff?: string) => {
    try {
      await api.post('/notifications/send-warning', {
        title,
        message,
        type: 'warning',
        targetRole: 'staff',
        targetStaff: targetStaff || 'all'
      });

      toast({
        title: "Warning Sent",
        description: targetStaff === 'all' || !targetStaff 
          ? "Warning notification has been sent to all staff members."
          : `Warning notification has been sent to the selected staff member.`,
        variant: "default",
      });

      // Refresh notifications
      fetchNotifications();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send warning notification to staff.",
        variant: "destructive",
      });
    }
  };

  const unreadCount = notifications.filter(notif => !notif.read).length;

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case "error":
        return <X className="h-4 w-4 text-red-500" />;
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        markAsRead,
        clearNotifications,
        sendWarningToStaff,
        unreadCount,
      }}
    >
      {children}
      
      {/* Notification Bell */}
      <div className="fixed top-20 right-6 z-40">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative p-2 rounded-lg bg-background border border-border hover:bg-muted transition-colors"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>

        {/* Notification Dropdown */}
        {isOpen && (
          <div className="absolute right-0 mt-2 w-96 bg-background border border-border rounded-lg shadow-lg max-h-96 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-semibold">Notifications</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={clearNotifications}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Clear All
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded hover:bg-muted transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto max-h-80">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Bell className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">No notifications</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-b border-border hover:bg-muted/30 transition-colors cursor-pointer ${
                      !notification.read ? "bg-muted/10" : ""
                    }`}
                    onClick={() => {
                      markAsRead(notification.id);
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-medium text-sm truncate">{notification.title}</h4>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {notification.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-muted-foreground">
                            {notification.timestamp.toLocaleDateString()}
                          </span>
                          {notification.targetRole && (
                            <span className="text-xs px-2 py-0.5 bg-muted rounded">
                              {notification.targetRole}
                            </span>
                          )}
                          {!notification.read && (
                            <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded">
                              New
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </NotificationContext.Provider>
  );
}
