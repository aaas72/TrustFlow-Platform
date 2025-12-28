import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getFreelancerBids, type BidItem } from "../../services/bidService";
import {
  getProjectById,
  type ProjectDetail,
} from "../../services/projectService";
import { getPlan } from "../../services/planService";
import { Button } from "../../components";
import {
  FiUser,
  FiCalendar,
  FiDollarSign,
  FiArrowRight,
  FiClock,
} from "react-icons/fi";

interface AcceptedProject extends ProjectDetail {
  project_id: number; // convenience alias for id
  hasPlan?: boolean;
}

export default function Current() {
  const [projects, setProjects] = useState<AcceptedProject[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const rawUser = localStorage.getItem("user");
        const user = rawUser ? JSON.parse(rawUser) : null;
        const freelancerId = user?.id;
        if (!freelancerId) {
          setError("Oturum gerekli: freelancer kimliği bulunamadı");
          setLoading(false);
          return;
        }
        const res = await getFreelancerBids(Number(freelancerId));
        if (!mounted) return;

        const accepted = (res.bids || []).filter(
          (b: BidItem) => String(b.status) === "accepted"
        );
        const uniqueProjectIds = Array.from(
          new Set(accepted.map((b) => b.project_id))
        );

        // Fetch full project details
        const fetchedProjects = await Promise.all(
          uniqueProjectIds.map(async (id) => {
            const pr = await getProjectById(id);
            if (pr.success && pr.project) {
              const status = String(pr.project.status || "").toLowerCase();
              // Filter out completed or cancelled if that's the intended logic for "Current"
              // Assuming "Current" means accepted but not necessarily finished.
              // If status is completed, maybe it shouldn't be here?
              // The original code filtered out completed/cancelled.
              const isPast = status === "completed" || status === "cancelled";
              if (isPast) return null;

              let hasPlan = false;
              try {
                const pl = await getPlan(id);
                if (pl.success && pl.plan) {
                  hasPlan = true;
                }
              } catch (error) {
                // Plan not found or error, treat as no plan
              }

              return {
                ...pr.project,
                project_id: id,
                hasPlan,
              } as AcceptedProject;
            }
            return null;
          })
        );

        if (mounted) {
          setProjects(
            fetchedProjects.filter((p): p is AcceptedProject => p !== null)
          );
          setError(null);
        }
      } catch (e: any) {
        if (mounted) setError(e?.message || "Projeler yüklenemedi");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "Belirtilmemiş";
    const d = new Date(dateStr);
    return !Number.isNaN(d.getTime())
      ? d.toLocaleDateString("tr-TR", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : dateStr;
  };

  const formatBudget = (val?: number | string | null) => {
    if (val === null || val === undefined) return "—";
    const n = Number(val);
    if (Number.isNaN(n)) return val;
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
    }).format(n);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <h3 className="text-xl font-bold text-gray-900 mb-6">
          Güncel Projeler
        </h3>
        <div className="space-y-4 animate-pulse">
          <div className="h-24 bg-gray-100 rounded-xl"></div>
          <div className="h-24 bg-gray-100 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <h3 className="text-xl font-bold text-gray-900 mb-6">
          Güncel Projeler
        </h3>
        <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-100">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
      {projects.length > 0 ? (
        <div className="space-y-4">
          {projects.map((p) => (
            <div
              key={p.project_id}
              className="group border border-gray-200 rounded-xl p-5 hover:border-blue-600  transition-all duration-200 bg-white"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <h4 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors mb-1">
                    {p.title || `Proje #${p.project_id}`}
                  </h4>
                  <p className="text-sm text-gray-500 mb-4">
                    {p.hasPlan
                      ? "Teklifiniz kabul edildi. Proje detaylarını ve süreci buradan yönetebilirsiniz."
                      : "Teklifiniz kabul edildi. Plan oluşturarak projeye başlayabilirsiniz."}
                  </p>

                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    <div className="flex items-center bg-gray-50 px-3 py-1.5 rounded-md border border-gray-100">
                      <FiUser className="mr-2 text-blue-500" />
                      <span>{(p as any).client_name || `Müşteri #${p.client_id}`}</span>
                    </div>
                    <div className="flex items-center bg-gray-50 px-3 py-1.5 rounded-md border border-gray-100">
                      <FiDollarSign className="mr-2 text-green-500" />
                      <span className="font-semibold text-gray-900">
                        {formatBudget(p.budget)}
                      </span>
                    </div>
                    {p.deadline && (
                      <div className="flex items-center bg-gray-50 px-3 py-1.5 rounded-md border border-gray-100">
                        <FiClock className="mr-2 text-orange-500" />
                        <span>Bitiş: {formatDate(p.deadline)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="shrink-0">
                  <Link to={`/freelancer/projects/${p.project_id}`}>
                    <Button className="w-full md:w-auto flex items-center justify-center">
                      {p.hasPlan ? "Proje Detayları" : "Planı Oluştur"}
                      <FiArrowRight className="ml-2" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200 border-dashed">
          <div className="text-gray-400 mb-2">
            <FiCalendar className="w-12 h-12 mx-auto opacity-50" />
          </div>
          <h4 className="text-lg font-medium text-gray-900 mb-1">
            Aktif Projeniz Yok
          </h4>
          <p className="text-gray-500">
            Güncel proje yok. Önce mevcut projelere başvurun ve teklifinizin
            kabul edilmesini bekleyin.
          </p>
        </div>
      )}
    </div>
  );
}
