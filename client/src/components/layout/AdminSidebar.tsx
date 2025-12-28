import React from 'react';
import { FiHome, FiUsers, FiFolder, FiDollarSign, FiStar, FiBarChart2, FiSettings } from "react-icons/fi";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const AdminSidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="bg-white h-screen fixed left-0 top-0 w-55 border-r border-gray-200">
      <div className="flex flex-col py-2">
        <div className="px-6 py-4">
          <h3 className="text-blue-600 text-xl font-bold">Admin Panel</h3>
        </div>

        <button
          className={`flex items-center py-3 px-6 ${
            activeTab === "dashboard" ? "text-blue-600 bg-blue-50" : "text-gray-600 hover:bg-gray-100"
          }`}
          onClick={() => onTabChange("dashboard")}
        >
          <FiHome className={`mr-3 ${activeTab === "dashboard" ? "text-blue-600" : "text-gray-500"}`} />
        <span className="text-sm">Panel</span>
        </button>

        <button
          className={`flex items-center py-3 px-6 ${
            activeTab === "users" ? "text-blue-600 bg-blue-50" : "text-gray-600 hover:bg-gray-100"
          }`}
          onClick={() => onTabChange("users")}
        >
          <FiUsers className={`mr-3 ${activeTab === "users" ? "text-blue-600" : "text-gray-500"}`} />
        <span className="text-sm">Kullanıcılar</span>
        </button>

        <button
          className={`flex items-center py-3 px-6 ${
            activeTab === "projects" ? "text-blue-600 bg-blue-50" : "text-gray-600 hover:bg-gray-100"
          }`}
          onClick={() => onTabChange("projects")}
        >
          <FiFolder className={`mr-3 ${activeTab === "projects" ? "text-blue-600" : "text-gray-500"}`} />
        <span className="text-sm">Projeler</span>
        </button>

        <button
          className={`flex items-center py-3 px-6 ${
            activeTab === "payments" ? "text-blue-600 bg-blue-50" : "text-gray-600 hover:bg-gray-100"
          }`}
          onClick={() => onTabChange("payments")}
        >
          <FiDollarSign className={`mr-3 ${activeTab === "payments" ? "text-blue-600" : "text-gray-500"}`} />
        <span className="text-sm">Ödemeler</span>
        </button>

        <button
          className={`flex items-center py-3 px-6 ${
            activeTab === "reviews" ? "text-blue-600 bg-blue-50" : "text-gray-600 hover:bg-gray-100"
          }`}
          onClick={() => onTabChange("reviews")}
        >
          <FiStar className={`mr-3 ${activeTab === "reviews" ? "text-blue-600" : "text-gray-500"}`} />
        <span className="text-sm">Değerlendirmeler</span>
        </button>

        <button
          className={`flex items-center py-3 px-6 ${
            activeTab === "reports" ? "text-blue-600 bg-blue-50" : "text-gray-600 hover:bg-gray-100"
          }`}
          onClick={() => onTabChange("reports")}
        >
          <FiBarChart2 className={`mr-3 ${activeTab === "reports" ? "text-blue-600" : "text-gray-500"}`} />
        <span className="text-sm">Raporlar</span>
        </button>

        <button
          className={`flex items-center py-3 px-6 ${
            activeTab === "settings" ? "text-blue-600 bg-blue-50" : "text-gray-600 hover:bg-gray-100"
          }`}
          onClick={() => onTabChange("settings")}
        >
          <FiSettings className={`mr-3 ${activeTab === "settings" ? "text-blue-600" : "text-gray-500"}`} />
        <span className="text-sm">Ayarlar</span>
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;