import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { ReactNode } from "react";
import NotificationSystem from "../notifications/NotificationSystem";
import type { Notification } from "../notifications/NotificationSystem";
import { FiUser, FiBriefcase, FiLogOut } from "react-icons/fi";
import Loader from "../loaders/Loader";

interface NavItem {
  key: string;
  label: string;
  icon?: ReactNode;
}

interface TopNavbarProps {
  userName: string;
  notifications?: Notification[];
  onMarkAsRead?: (notificationId: string) => void;
  onMarkAllAsRead?: () => void;
  onDeleteNotification?: (notificationId: string) => void;
  userRole?: "client" | "freelancer";
  menuItems?: NavItem[];
  activeKey?: string;
  onChange?: (key: string) => void;
}

const TopNavbar: React.FC<TopNavbarProps> = ({
  userName,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  userRole,
  menuItems,
  activeKey,
  onChange,
}) => {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = () => {
    if (loggingOut) return;
    setLoggingOut(true);
    setTimeout(() => {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/login");
    }, 3000);
  };
  const brandName: string =
    (import.meta as any)?.env?.VITE_APP_NAME || "Güven Akşı";
  // Rol etiketi: ikinci satırda, menü düğmelerinden önce (isteğe göre biçimlendirildi)
  const roleLabel: string =
    userRole === "client"
      ? "Müşteri"
      : userRole === "freelancer"
      ? "freelancer"
      : "Kullanıcı";
  const roleClass: string = "text-sm font-semibold text-blue-600";

  return (
    <nav className=" bg-white border-b border-gray-200 w-full sticky top-0 z-50">
      <div className="container mx-auto px-4 py-2">
        <div className="grid grid-rows-[1fr_1fr] items-center">
          <div className="flex justify-between items-center space-x-4 mb-4">
            <div className="text-xl font-bold text-blue-600">{brandName}</div>
            <div className="flex justify-end items-center space-x-2">
              {userRole && (
                <NotificationSystem
                  notifications={notifications || []}
                  onMarkAsRead={onMarkAsRead || (() => {})}
                  onMarkAllAsRead={onMarkAllAsRead || (() => {})}
                  onDeleteNotification={onDeleteNotification || (() => {})}
                  userRole={userRole}
                />
              )}
              <div className="relative">
                <div
                  className="w-8 h-8 rounded-full border border-blue-600 m-auto hover:bg-blue-600 hover:text-white text-blue-600 flex justify-center items-center transition-colors cursor-pointer"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                >
                  {userName.charAt(0)}
                </div>
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-20">
                    <button
                      onClick={handleLogout}
                      disabled={loggingOut}
                      className={`flex items-center gap-2 w-full px-4 py-2 text-sm ${
                        loggingOut
                          ? "text-gray-400 cursor-not-allowed"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {loggingOut ? (
                        <Loader size="sm" text="" overlay={false} />
                      ) : (
                        <FiLogOut />
                      )}
                      <span>Çıkış Yap</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <div className="flex items-center gap-1.5">
              {userRole === "client" ? (
                <FiUser className="text-blue-600" />
              ) : userRole === "freelancer" ? (
                <FiBriefcase className="text-blue-600" />
              ) : null}
              <span className={roleClass}>{roleLabel}</span>
            </div>
            <span
              aria-hidden="true"
              className="mx-2 h-5 w-px bg-blue-300"
            ></span>
            {menuItems &&
              menuItems.map((item) => (
                <button
                  key={item.key}
                  onClick={() => onChange && onChange(item.key)}
                  className={`group text-sm flex items-center gap-1.5 px-3 py-1.5 rounded-md border transition-colors ${
                    activeKey === item.key
                      ? "bg-blue-50 border-blue-300 text-blue-700"
                      : "bg-white border-gray-200 text-gray-800 hover:bg-blue-50"
                  }`}
                >
                  {item.icon && (
                    <span className="text-blue-600 text-sm">{item.icon}</span>
                  )}
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default TopNavbar;