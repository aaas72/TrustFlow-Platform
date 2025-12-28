import { useEffect, useState } from "react";
import { ParticlesBackground } from "../../components";
import {
  FiFolder,
  FiDollarSign,
  FiClock,
  FiArrowRight,
  FiActivity,
  FiPlus,
} from "react-icons/fi";
import { Link } from "react-router-dom";
import { getClientActiveProjects } from "../../services/projectService";
import { getClientStats } from "../../services/paymentService";
import {
  getNotifications,
  type NotificationItem,
} from "../../services/notificationService";

export default function Dashboard() {
  const [stats, setStats] = useState({
    total_spent: 0,
    total_projects_count: 0,
    active_projects_count: 0,
  });
  const [activeProjects, setActiveProjects] = useState<any[]>([]);
  const [activities, setActivities] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const rawUser = localStorage.getItem("user");
        const user = rawUser ? JSON.parse(rawUser) : null;
        setUserName(user?.full_name || "Müşteri");

        const [statsRes, projectsRes, notifRes] = await Promise.all([
          getClientStats(),
          getClientActiveProjects(),
          getNotifications({ limit: 5 }),
        ]);

        if (statsRes.success) {
          setStats(statsRes.stats);
        }
        if (projectsRes.success) {
          setActiveProjects(projectsRes.projects);
        }
        if (notifRes.success) {
          setActivities(notifRes.notifications);
        }
      } catch (error) {
        console.error("Client Dashboard data fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const StatCard = ({ title, value, icon, color, subtext }: any) => {
    const colorClasses: any = {
      blue: "bg-blue-50 text-blue-600 border-blue-200",
      green: "bg-green-50 text-green-600 border-green-200",
      yellow: "bg-yellow-50 text-yellow-600 border-yellow-200",
      purple: "bg-purple-50 text-purple-600 border-purple-200",
      indigo: "bg-indigo-50 text-indigo-600 border-indigo-200",
    };

    return (
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-300">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
            <h3 className="text-2xl font-bold text-slate-800">
              {loading ? (
                <span className="inline-block w-16 h-8 bg-slate-100 animate-pulse rounded"></span>
              ) : (
                value
              )}
            </h3>
            {subtext && (
              <p className="text-xs text-slate-400 mt-1">{subtext}</p>
            )}
          </div>
          <div
            className={`p-3 rounded-lg ${
              colorClasses[color] || colorClasses.blue
            }`}
          >
            {icon}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Welcome Section */}
      <div className="relative overflow-hidden bg-linear-to-br from-indigo-600 to-indigo-900 rounded-2xl shadow-lg">
        <div className="absolute inset-0 pointer-events-none opacity-30">
          <ParticlesBackground />
        </div>
        <div className="relative z-10 p-8 md:p-10 text-white flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              Hoşgeldin, {userName}
            </h1>
            <p className="text-indigo-100 text-lg max-w-2xl">
              Projelerini yönet, teklifleri değerlendir ve iş akışını takip et.
            </p>
          </div>
          <div>
            <Link
              to="/client/create"
              className="inline-flex items-center px-5 py-3 border border-transparent text-base font-medium rounded-lg text-indigo-700 bg-white hover:bg-indigo-50 transition-colors shadow-sm"
            >
              <FiPlus className="mr-2 -ml-1 h-5 w-5" />
              Yeni Proje Oluştur
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Toplam Proje"
          value={stats.total_projects_count}
          icon={<FiFolder className="w-6 h-6" />}
          color="indigo"
          subtext="Oluşturulan tüm projeler"
        />
        <StatCard
          title="Aktif Projeler"
          value={stats.active_projects_count}
          icon={<FiActivity className="w-6 h-6" />}
          color="green"
          subtext="Devam eden süreçler"
        />
        <StatCard
          title="Toplam Harcama"
          value={`${(stats.total_spent || 0).toLocaleString("tr-TR")} ₺`}
          icon={<FiDollarSign className="w-6 h-6" />}
          color="blue"
          subtext="Tamamlanan ödemeler"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Active Projects Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <FiFolder className="text-indigo-600" />
              Aktif Projeler
            </h2>
            <Link
              to="/client/projects"
              className="text-indigo-600 hover:text-indigo-700 text-sm font-medium flex items-center gap-1"
            >
              Tümünü Gör <FiArrowRight />
            </Link>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-slate-500">
                Yükleniyor...
              </div>
            ) : activeProjects.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Proje
                      </th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Teklifler
                      </th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Bütçe
                      </th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Sonraki Aşama
                      </th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activeProjects.map((project) => (
                      <tr
                        key={project.id}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-800">
                            {project.title}
                          </div>
                          <div className="text-xs text-slate-500 truncate max-w-[200px]">
                            {project.description}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {project.pending_bids_count || 0} Yeni
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-slate-800">
                            {project.budget
                              ? `${Number(project.budget).toLocaleString()} ₺`
                              : "-"}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1 text-sm text-slate-600">
                            <FiClock className="w-4 h-4 text-orange-400" />
                            {project.next_milestone_date
                              ? new Date(
                                  project.next_milestone_date
                                ).toLocaleDateString("tr-TR")
                              : "-"}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            to={`/client/projects/${project.id}`}
                            className="inline-flex items-center justify-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                            Yönet
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center">
                <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiFolder className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-1">
                  Aktif Proje Yok
                </h3>
                <p className="text-slate-500 mb-4">
                  Henüz devam eden bir projeniz bulunmuyor.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity Column */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <FiActivity className="text-purple-600" />
            Son Aktiviteler
          </h2>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            {activities.length > 0 ? (
              <div className="space-y-6">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex gap-4">
                    <div
                      className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
                        activity.type.includes("payment")
                          ? "bg-green-500"
                          : activity.type.includes("bid")
                          ? "bg-blue-500"
                          : "bg-slate-400"
                      }`}
                    />
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {activity.title}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {activity.message}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-2">
                        {new Date(activity.created_at).toLocaleDateString(
                          "tr-TR",
                          {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-slate-500 py-4">
                Henüz aktivite yok.
              </div>
            )}
          </div>

          {/* Quick Tip Card */}
          <div className="bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
            <h3 className="font-bold text-lg mb-2">İpucu</h3>
            <p className="text-purple-100 text-sm mb-4">
              Projeleriniz için detaylı açıklamalar yazmak, daha kaliteli
              teklifler almanızı sağlar.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}