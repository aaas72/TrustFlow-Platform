import React from "react";
import {
  FiHome,
  FiFolder,
  FiArchive,
  FiMessageSquare,
  FiDollarSign,
  FiUser,
  FiSettings,
} from "react-icons/fi";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="bg-white h-screen fixed left-0 top-0 w-55 border-r border-gray-200">
      <div className="flex flex-col py-2">
        <div className="px-6 py-4">
          <h3 className="text-blue-600 text-xl font-bold">
            Serbest Çalışan Paneli
          </h3>
        </div>

        <button
          className={`flex items-center py-3 px-6 ${
            activeTab === "dashboard"
              ? "text-blue-600 bg-blue-50"
              : "text-gray-600 hover:bg-gray-100"
          }`}
          onClick={() => onTabChange("dashboard")}
        >
          <FiHome
            className={`mr-3 ${
              activeTab === "dashboard" ? "text-blue-600" : "text-gray-500"
            }`}
          />
          <span className="text-sm">Kontrol Paneli</span>
        </button>

        <button
          className={`flex items-center py-3 px-6 ${
            activeTab === "available"
              ? "text-blue-600 bg-blue-50"
              : "text-gray-600 hover:bg-gray-100"
          }`}
          onClick={() => onTabChange("available")}
        >
          <FiFolder
            className={`mr-3 ${
              activeTab === "available" ? "text-blue-600" : "text-gray-500"
            }`}
          />
          <span className="text-sm">Mevcut Projeler</span>
        </button>

        <button
          className={`flex items-center py-3 px-6 ${
            activeTab === "current"
              ? "text-blue-600 bg-blue-50"
              : "text-gray-600 hover:bg-gray-100"
          }`}
          onClick={() => onTabChange("current")}
        >
          <FiFolder
            className={`mr-3 ${
              activeTab === "current" ? "text-blue-600" : "text-gray-500"
            }`}
          />
          <span className="text-sm">Aktif Projeler</span>
        </button>

        <button
          className={`flex items-center py-3 px-6 ${
            activeTab === "past"
              ? "text-blue-600 bg-blue-50"
              : "text-gray-600 hover:bg-gray-100"
          }`}
          onClick={() => onTabChange("past")}
        >
          <FiArchive
            className={`mr-3 ${
              activeTab === "past" ? "text-blue-600" : "text-gray-500"
            }`}
          />
          <span className="text-sm">Geçmiş Projeler</span>
        </button>

        <button
          className={`flex items-center py-3 px-6 ${
            activeTab === "messages"
              ? "text-blue-600 bg-blue-50"
              : "text-gray-600 hover:bg-gray-100"
          }`}
          onClick={() => onTabChange("messages")}
        >
          <FiMessageSquare
            className={`mr-3 ${
              activeTab === "messages" ? "text-blue-600" : "text-gray-500"
            }`}
          />
          <span className="text-sm">Mesajlar</span>
        </button>

        <button
          className={`flex items-center py-3 px-6 ${
            activeTab === "payments"
              ? "text-blue-600 bg-blue-50"
              : "text-gray-600 hover:bg-gray-100"
          }`}
          onClick={() => onTabChange("payments")}
        >
          <FiDollarSign
            className={`mr-3 ${
              activeTab === "payments" ? "text-blue-600" : "text-gray-500"
            }`}
          />
          <span className="text-sm">Ödemeler</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
