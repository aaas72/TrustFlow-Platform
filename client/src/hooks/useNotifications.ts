import { useEffect, useState, useCallback } from "react";
import { initSocket } from "../lib/realtime";
import { NOTIFICATIONS_ENABLED } from "../lib/config";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type NotificationItem,
} from "../services/notificationService";
import type { Notification } from "../components/notifications/NotificationSystem";

function mapItemToNotification(n: NotificationItem): Notification {
  return {
    id: String(n.id),
    type: (n.type as any) || "general",
    title: n.title || "Bildirim",
    message: n.message || "",
    priority: (n.priority as any) || "medium",
    actionRequired: !!n.action_required,
    timestamp: new Date(n.created_at || Date.now()),
    isRead: !!n.is_read,
    projectId: n.project_id ? String(n.project_id) : undefined,
    milestoneId: n.milestone_id ? String(n.milestone_id) : undefined,
  };
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Initial fetch (guarded by flag)
  useEffect(() => {
    if (!NOTIFICATIONS_ENABLED) {
      setNotifications([]);
      return;
    }
    (async () => {
      const res = await getNotifications();
      if (res.success) {
        setNotifications(res.notifications.map(mapItemToNotification));
      }
    })();
  }, []);

  // Socket subscription (guarded by flag)
  useEffect(() => {
    if (!NOTIFICATIONS_ENABLED) return;
    try {
      const rawUser = localStorage.getItem("user");
      const user = rawUser ? JSON.parse(rawUser) : null;
      const userId = user && user.id ? user.id : undefined;
      const socket = initSocket(userId);
      if (!socket) return;
      socket.on("notification:new", (payload: any) => {
        const createdAt = payload?.created_at
          ? new Date(payload.created_at)
          : new Date();
        const incomingId = payload?.id ? String(payload.id) : "";
        const newItem: Notification = {
          id: incomingId || Math.random().toString(36).slice(2),
          type: (payload?.type as any) || "general",
          title: payload?.title || "Yeni Bildirim",
          message: payload?.message || "Yeni bir olay gerçekleşti",
          priority: (payload?.priority as any) || "medium",
          actionRequired: !!payload?.action_required,
          timestamp: createdAt,
          isRead: false,
          projectId: payload?.project_id ? String(payload.project_id) : undefined,
          milestoneId: payload?.milestone_id ? String(payload.milestone_id) : undefined,
        };

        setNotifications((prev) => {
          // If the notification with same id already exists, update details but don't re-add
          if (incomingId) {
            const alreadyIndex = prev.findIndex((n) => n.id === incomingId);
            if (alreadyIndex !== -1) {
              const updated = [...prev];
              const existing = updated[alreadyIndex];
              updated[alreadyIndex] = {
                ...existing,
                // keep read state if user already read it
                isRead: existing.isRead,
                title: newItem.title,
                message: newItem.message,
                priority: newItem.priority,
                actionRequired: newItem.actionRequired,
                timestamp: newItem.timestamp,
                projectId: newItem.projectId,
                milestoneId: newItem.milestoneId,
              };
              return updated;
            }
          }

          // If no id, try to dedupe by signature within a short time window
          const windowMs = 60 * 1000; // 1 minute window for duplicate suppression
          const hasSimilar = prev.some((n) => {
            const sameCore =
              n.type === newItem.type &&
              n.title === newItem.title &&
              n.message === newItem.message &&
              (n.projectId || "") === (newItem.projectId || "") &&
              (n.milestoneId || "") === (newItem.milestoneId || "");
            const closeInTime = Math.abs(n.timestamp.getTime() - createdAt.getTime()) < windowMs;
            return sameCore && closeInTime;
          });
          if (hasSimilar) return prev;

          return [newItem, ...prev];
        });
      });
    } catch (e) {
      // ignore
    }
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    if (!NOTIFICATIONS_ENABLED) return;
    const numId = Number(id);
    const res = await markNotificationRead(numId);
    if (res.success) {
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!NOTIFICATIONS_ENABLED) return;
    const res = await markAllNotificationsRead();
    if (res.success) {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    }
  }, []);

  const deleteLocal = useCallback((id: string) => {
    if (!NOTIFICATIONS_ENABLED) return;
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return { notifications, markAsRead, markAllAsRead, deleteLocal };
}
