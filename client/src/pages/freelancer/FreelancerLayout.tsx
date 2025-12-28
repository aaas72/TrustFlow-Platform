import { useEffect, useMemo, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { TopNavbar, GlobalLoader, TopBarLoader } from "../../components";
import type { Notification } from "../../components";
import {
  FiHome,
  FiFolder,
  FiArchive,
  FiMessageSquare,
  FiDollarSign,
  FiUser,
  FiSettings,
  FiCheckCircle,
} from "react-icons/fi";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from "../../services/notificationService";
import { socketService } from "../../services/socketService";

export default function FreelancerLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [userName, setUserName] = useState<string>("Freelancer");
  const [routeLoading, setRouteLoading] = useState<boolean>(false);
  const [timerId, setTimerId] = useState<number | null>(null);

  useEffect(() => {
    const rawUser = localStorage.getItem("user");
    const user = rawUser ? JSON.parse(rawUser) : null;
    const nameCandidate =
      user?.fullName || user?.name || user?.username || "Freelancer";
    setUserName(nameCandidate);
  }, []);

  // Initial load
  useEffect(() => {
    const load = async () => {
      const res = await getNotifications();
      if (res.success) {
        const mapped = (res.notifications || []).map((n) => ({
          id: String(n.id),
          type: n.type,
          title: n.title,
          message: n.message,
          priority: n.priority as any,
          actionRequired: !!n.action_required,
          timestamp: new Date(n.created_at),
          isRead: !!n.is_read,
        }));
        setNotifications(mapped as Notification[]);
      }
    };
    load();
  }, []);

  // Socket listener
  useEffect(() => {
    socketService.connect();

    const handleNewNotification = (data: any) => {
      console.log("New notification received:", data);
      const newNotif: Notification = {
        id: String(data.id || Date.now()),
        type: data.type,
        title: data.title,
        message: data.message,
        priority: data.priority || "medium",
        actionRequired: !!data.action_required,
        timestamp: new Date(data.created_at || Date.now()),
        isRead: false,
        projectId: data.project_id ? String(data.project_id) : undefined,
        milestoneId: data.milestone_id ? String(data.milestone_id) : undefined,
      };
      setNotifications((prev) => [newNotif, ...prev]);

      // Optional: Play sound
      try {
        const audio = new Audio("/notification.mp3"); // Make sure this file exists or remove this line
        audio.play().catch(() => {});
      } catch (e) {}
    };

    socketService.on("notification:new", handleNewNotification);

    return () => {
      socketService.off("notification:new", handleNewNotification);
    };
  }, []);

  useEffect(() => {
    setRouteLoading(true);
    if (timerId) {
      clearTimeout(timerId);
    }
    const id = window.setTimeout(() => {
      setRouteLoading(false);
      setTimerId(null);
    }, 500);
    setTimerId(id);
    return () => {
      clearTimeout(id);
    };
  }, [location.pathname]);

  const menuItems = useMemo(
    () => [
      { key: "dashboard", label: "Kontrol Paneli", icon: <FiHome /> },
      { key: "available", label: "Mevcut Projeler", icon: <FiFolder /> },
      { key: "current", label: "Güncel Projeler", icon: <FiCheckCircle /> },
      { key: "past", label: "Geçmiş Projeler", icon: <FiArchive /> },
      { key: "payments", label: "Ödemeler", icon: <FiDollarSign /> },
    ],
    []
  );

  const activeKey = useMemo(() => {
    const seg = location.pathname.split("/").filter(Boolean);
    return seg[1] || "dashboard";
  }, [location.pathname]);

  const onChange = (key: string) => {
    navigate(`/freelancer/${key}`);
  };

  const onMarkAsRead = async (id: string) => {
    await markNotificationRead(Number(id));
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const onMarkAllAsRead = async () => {
    await markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const onDeleteNotification = async (id: string) => {
    await deleteNotification(Number(id));
    setNotifications((prev) => prev.filter((n) => String(n.id) !== id));
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <div className="flex-1 flex flex-col">
        <GlobalLoader />
        <TopNavbar
          userName={userName}
          notifications={notifications}
          onMarkAsRead={onMarkAsRead}
          onMarkAllAsRead={onMarkAllAsRead}
          onDeleteNotification={onDeleteNotification}
          userRole="freelancer"
          menuItems={menuItems}
          activeKey={activeKey}
          onChange={onChange}
        />
        <div className="p-6">
          <div className="container mx-auto relative">
            <TopBarLoader active={routeLoading} />
            {!routeLoading && <Outlet />}
          </div>
        </div>
      </div>
    </div>
  );
}
