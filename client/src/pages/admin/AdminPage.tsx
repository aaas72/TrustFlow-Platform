
import { useState } from "react";
import TopNavbar from "../../components/layout/TopNavbar";
import StatCard from "../../components/ui/StatCard";
import { FiBarChart2, FiHome, FiUsers, FiFolder, FiDollarSign, FiStar, FiSettings } from "react-icons/fi";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("dashboard");

  const stats = {
    users: 542,
    projects: 196,
    payments: "320,000₺",
    flaggedChats: 3,
  };

  const adminItems = [
    { key: "dashboard", label: "Panel", icon: <FiHome /> },
    { key: "users", label: "Kullanıcılar", icon: <FiUsers /> },
    { key: "projects", label: "Projeler", icon: <FiFolder /> },
    { key: "payments", label: "Ödemeler", icon: <FiDollarSign /> },
    { key: "reviews", label: "Değerlendirmeler", icon: <FiStar /> },
    { key: "reports", label: "Raporlar", icon: <FiBarChart2 /> },
    { key: "settings", label: "Ayarlar", icon: <FiSettings /> },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Main */}
      <div className="flex-1 flex flex-col">
        <TopNavbar 
          userName="Yönetici" 
          menuItems={adminItems}
          activeKey={activeTab}
          onChange={setActiveTab}
        />

        <div className="p-6">
          <div className="container mx-auto">
            {activeTab === "dashboard" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatCard title="Kullanıcı Sayısı" value={stats.users} icon={<FiBarChart2 />} color="indigo" />
                  <StatCard title="Proje Sayısı" value={stats.projects} icon={<FiBarChart2 />} color="green" />
                  <StatCard title="Toplam Ödemeler" value={stats.payments} icon={<FiBarChart2 />} color="blue" />
                  <StatCard title="Raporlanan Sohbetler" value={stats.flaggedChats} icon={<FiBarChart2 />} color="yellow" />
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg text-gray-500 font-semibold mb-4">Genel Bakış</h3>
                  <p className="text-gray-600">Göstergeleri ve sorunları izlemek için basit bir kontrol paneli.</p>
                </div>
              </div>
            )}

            {activeTab === "users" && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg text-gray-700 font-semibold mb-4">Kullanıcı Yönetimi</h3>
                <p className="text-gray-600">Kullanıcı listesi ve yönetim işlemleri.</p>
              </div>
            )}

            {activeTab === "projects" && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg text-gray-700 font-semibold mb-4">Proje Yönetimi</h3>
                <p className="text-gray-600">Projeleri gözden geçir ve durumları yönet.</p>
              </div>
            )}

            {activeTab === "payments" && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg text-gray-700 font-semibold mb-4">Ödemeler</h3>
                <p className="text-gray-600">Ödeme ve transfer özetleri.</p>
              </div>
            )}

            {activeTab === "reviews" && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg text-gray-700 font-semibold mb-4">Değerlendirmeler</h3>
                <p className="text-gray-600">Değerlendirmeleri ve anlaşmazlıkları incele.</p>
              </div>
            )}

            {activeTab === "reports" && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg text-gray-700 font-semibold mb-4">Raporlar</h3>
                <p className="text-gray-600">Performans ve istatistik raporları.</p>
              </div>
            )}

            {activeTab === "settings" && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg text-gray-700 font-semibold mb-4">Ayarlar</h3>
                <p className="text-gray-600">Genel sistem ayarları.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}