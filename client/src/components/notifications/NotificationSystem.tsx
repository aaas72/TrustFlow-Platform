import type { FC } from "react";
import { useState } from "react";
import {
  FiBell,
  FiX,
  FiCheckCircle,
  FiAlertCircle,
  FiDollarSign,
  FiUser,
  FiFileText,
} from "react-icons/fi";

export interface Notification {
  id: string;
  type:
    | "milestone_funded"
    | "milestone_submitted"
    | "milestone_approved"
    | "revision_requested"
    | "payment_released"
    | "plan_submitted"
    | "bid_submitted"
    | "bid_accepted"
    | "general";
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  projectId?: string;
  milestoneId?: string;
  actionRequired?: boolean;
  priority: "low" | "medium" | "high";
}

interface NotificationSystemProps {
  notifications: Notification[];
  onMarkAsRead: (notificationId: string) => void;
  onMarkAllAsRead: () => void;
  onDeleteNotification: (notificationId: string) => void;
  userRole: "client" | "freelancer";
}

export function createNotificationTemplate(
  type: Notification["type"],
  role: "client" | "freelancer" = "client",
  data?: { amount?: number }
): Omit<Notification, "id" | "timestamp" | "isRead"> {
  const base = { priority: "medium" as const, actionRequired: false };
  switch (type) {
    case "plan_submitted":
      return {
        ...base,
        type,
        title: role === "client" ? "Proje planı sunuldu" : "Planı sundunuz",
        message:
          role === "client"
            ? "Proje için detaylı plan sunuldu. İnceleyin ve onaylayın."
            : "Proje planınızı sundunuz. Müşteri onayı bekleniyor.",
        priority: "high",
        actionRequired: role === "client",
      };
    case "milestone_submitted":
      return {
        ...base,
        type,
        title:
          role === "client" ? "Aşama teslim edildi" : "Aşamayı teslim ettiniz",
        message:
          role === "client"
            ? "Teslim edilen aşamayı inceleyin ve karar verin."
            : "Aşama teslim edildi. Müşteri onayı bekleniyor.",
        priority: "high",
        actionRequired: role === "client",
      };
    case "revision_requested":
      return {
        ...base,
        type,
        title:
          role === "freelancer" ? "Revizyon istendi" : "Revizyon istediniz",
        message:
          role === "freelancer"
            ? "Aşama için revizyon talep edildi. Notları inceleyin."
            : "Revizyon talebiniz iletildi. Freelancer düzeltmeleri yapacak.",
        priority: "high",
        actionRequired: role === "freelancer",
      };
    case "milestone_approved":
      return {
        ...base,
        type,
        title: "Aşama onaylandı",
        message:
          role === "freelancer"
            ? "Aşama onaylandı. Ödeme serbest bırakıldı."
            : "Aşamayı onayladınız. Ödeme serbest bırakıldı.",
        priority: "medium",
      };
    case "milestone_funded":
      return {
        ...base,
        type,
        title: "Aşama finanse edildi",
        message:
          role === "freelancer"
            ? "Aşama için ödeme yatırıldı. Çalışmaya başlayabilirsiniz."
            : "Aşama için ödemeyi yaptınız. Çalışma başlayacak.",
        priority: "high",
      };
    case "payment_released":
      return {
        ...base,
        type,
        title: "Ödeme serbest bırakıldı",
        message: `${(data?.amount ?? 0).toLocaleString(
          "tr-TR"
        )} TL ödeme serbest bırakıldı.`,
        priority: "medium",
      };
    default:
      return {
        ...base,
        type: "general",
        title: "Genel bildirim",
        message: "Yeni bir bildirim",
        priority: "low",
      };
  }
}

const NotificationSystem: FC<NotificationSystemProps> = ({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread" | "action_required">(
    "all"
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const actionRequiredCount = notifications.filter(
    (n) => n.actionRequired && !n.isRead
  ).length;

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "milestone_funded":
        return <FiDollarSign className="w-5 h-5 text-green-600" />;
      case "milestone_submitted":
        return <FiFileText className="w-5 h-5 text-blue-600" />;
      case "milestone_approved":
        return <FiCheckCircle className="w-5 h-5 text-green-600" />;
      case "revision_requested":
        return <FiAlertCircle className="w-5 h-5 text-red-600" />;
      case "payment_released":
        return <FiDollarSign className="w-5 h-5 text-green-600" />;
      case "plan_submitted":
        return <FiUser className="w-5 h-5 text-purple-600" />;
      default:
        return <FiBell className="w-5 h-5 text-gray-600" />;
    }
  };

  const getNotificationColor = (
    type: Notification["type"],
    isRead: boolean
  ) => {
    // Okunmamışsa hafif mavi, okunmuşsa beyaz
    if (!isRead) return "bg-blue-50";
    return "bg-white";
  };

  const getTypeText = (type: Notification["type"]) => {
    switch (type) {
      case "milestone_funded":
        return "Aşama Finanse Edildi";
      case "milestone_submitted":
        return "Aşama Teslim Edildi";
      case "milestone_approved":
        return "Aşama Onaylandı";
      case "revision_requested":
        return "Revizyon İstendi";
      case "payment_released":
        return "Ödeme Serbest Bırakıldı";
      case "plan_submitted":
        return "Plan Sunuldu";
      default:
        return "Bildirim";
    }
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - timestamp.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "Şimdi";
    if (diffInMinutes < 60) return `${diffInMinutes}dk`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}s`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}g`;

    return timestamp.toLocaleDateString("tr-TR");
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <FiBell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center border-2 border-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          ></div>

          {/* Panel */}
          <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[32rem] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-3 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
              <h3 className="font-semibold text-gray-900">Bildirimler</h3>
              <div className="flex items-center gap-3">
                {unreadCount > 0 && (
                  <button
                    onClick={onMarkAllAsRead}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Tümünü Oku
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto flex-1">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500 flex flex-col items-center justify-center h-48">
                  <FiBell className="w-8 h-8 mb-2 text-gray-300" />
                  <p className="text-sm">Henüz bildirim yok</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${getNotificationColor(
                        notification.type,
                        notification.isRead
                      )}`}
                      onClick={() =>
                        !notification.isRead && onMarkAsRead(notification.id)
                      }
                    >
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4
                              className={`text-sm ${
                                !notification.isRead
                                  ? "font-semibold text-gray-900"
                                  : "font-medium text-gray-700"
                              }`}
                            >
                              {notification.title}
                            </h4>
                            <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
                              {formatTimeAgo(notification.timestamp)}
                            </span>
                          </div>

                          <p
                            className={`text-sm mt-1 ${
                              !notification.isRead
                                ? "text-gray-800"
                                : "text-gray-500"
                            }`}
                          >
                            {notification.message}
                          </p>

                          {/* Action Buttons (Simplified) */}
                          <div className="mt-2 flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteNotification(notification.id);
                              }}
                              className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1"
                              title="Sil"
                            >
                              <FiX className="w-3 h-3" /> Sil
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Helper function to create notifications for different milestone events
export const createMilestoneNotification = (
  type: Notification["type"],
  projectTitle: string,
  milestoneTitle: string,
  userRole: "client" | "freelancer",
  additionalData?: any
): Omit<Notification, "id" | "timestamp" | "isRead"> => {
  const baseNotification = {
    projectId: additionalData?.projectId,
    milestoneId: additionalData?.milestoneId,
    priority: "medium" as const,
    actionRequired: false,
  };

  switch (type) {
    case "milestone_funded":
      return {
        ...baseNotification,
        type,
        title:
          userRole === "freelancer"
            ? `Aşama finanse edildi: ${milestoneTitle}`
            : `Aşamayı finanse ettiniz: ${milestoneTitle}`,
        message:
          userRole === "freelancer"
            ? `${projectTitle} projesinde "${milestoneTitle}" aşaması için ödeme alındı. Çalışmaya başlayabilirsiniz.`
            : `${projectTitle} projesinde "${milestoneTitle}" aşaması için ödeme yaptınız. Freelancer çalışmaya başlayacak.`,
        priority: "high",
        actionRequired: userRole === "freelancer",
      };

    case "milestone_submitted":
      return {
        ...baseNotification,
        type,
        title:
          userRole === "client"
            ? `Aşama teslim edildi: ${milestoneTitle}`
            : `Aşamayı teslim ettiniz: ${milestoneTitle}`,
        message:
          userRole === "client"
            ? `${projectTitle} projesinde "${milestoneTitle}" aşaması teslim edildi. İnceleme yapıp karar verin.`
            : `${projectTitle} projesinde "${milestoneTitle}" aşamasını teslim ettiniz. Müşteri onayı bekleniyor.`,
        priority: "high",
        actionRequired: userRole === "client",
      };

    case "milestone_approved":
      return {
        ...baseNotification,
        type,
        title: `Aşama onaylandı: ${milestoneTitle}`,
        message:
          userRole === "freelancer"
            ? `${projectTitle} projesinde "${milestoneTitle}" aşaması onaylandı. Ödeme hesabınıza aktarıldı.`
            : `${projectTitle} projesinde "${milestoneTitle}" aşamasını onayladınız. Ödeme freelancer'a aktarıldı.`,
        priority: "medium",
      };

    case "revision_requested":
      return {
        ...baseNotification,
        type,
        title:
          userRole === "freelancer"
            ? `Revizyon istendi: ${milestoneTitle}`
            : `Revizyon istediniz: ${milestoneTitle}`,
        message:
          userRole === "freelancer"
            ? `${projectTitle} projesinde "${milestoneTitle}" aşaması için revizyon istendi. Notları inceleyin.`
            : `${projectTitle} projesinde "${milestoneTitle}" aşaması için revizyon istediniz. Freelancer düzeltmeleri yapacak.`,
        priority: "high",
        actionRequired: userRole === "freelancer",
      };

    case "payment_released":
      return {
        ...baseNotification,
        type,
        title: `Ödeme serbest bırakıldı: ${milestoneTitle}`,
        message: `${projectTitle} projesinde "${milestoneTitle}" aşaması için ${
          additionalData?.amount || 0
        } TL ödeme serbest bırakıldı.`,
        priority: "medium",
      };

    case "plan_submitted":
      return {
        ...baseNotification,
        type,
        title:
          userRole === "client"
            ? `Proje planı sunuldu: ${projectTitle}`
            : `Proje planını sundunuz: ${projectTitle}`,
        message:
          userRole === "client"
            ? `${projectTitle} projesi için detaylı plan sunuldu. İnceleme yapıp onaylayın.`
            : `${projectTitle} projesi için planınızı sundunuz. Müşteri onayı bekleniyor.`,
        priority: "high",
        actionRequired: userRole === "client",
      };

    default:
      return {
        ...baseNotification,
        type: "general",
        title: "Genel Bildirim",
        message: "Yeni bir bildirim aldınız.",
        priority: "low",
      };
  }
};

export default NotificationSystem;
