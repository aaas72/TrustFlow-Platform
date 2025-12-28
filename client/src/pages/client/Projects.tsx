import { useEffect, useMemo, useState } from "react";
import { Button, Loader, BidsList } from "../../components";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../context/ToastContext";
import {
  getClientProjects,
  type ClientProject,
  updateProject,
  deleteProject,
} from "../../services/projectService";
import {
  FiMoreVertical,
  FiLoader,
  FiFolder,
  FiCalendar,
  FiDollarSign,
  FiFilter,
  FiSearch,
} from "react-icons/fi";
import { getProjectMilestones } from "../../services/milestoneService";
import {
  getPaymentsByMilestone,
  type PaymentItem,
} from "../../services/paymentService";

export default function Projects() {
  const navigate = useNavigate();
  const { success: toastSuccess, error: toastError } = useToast();
  const [projects, setProjects] = useState<ClientProject[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(
    null
  );
  const [actionMenuProjectId, setActionMenuProjectId] = useState<number | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState("");

  // Completion eligibility cache per project
  const [completionState, setCompletionState] = useState<
    Record<
      number,
      {
        loading: boolean; // eligibility check in progress
        canComplete: boolean; // all milestones approved & paid
        completing?: boolean; // completion request in flight
        reason?: string; // why cannot complete
        error?: string; // server error while completing
      }
    >
  >({});

  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [projectFilter, setProjectFilter] = useState<
    "all" | "open" | "in_progress" | "completed"
  >("all");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const rawUser = localStorage.getItem("user");
        const user = rawUser ? JSON.parse(rawUser) : null;
        const clientId = user?.id;
        if (clientId) {
          const res = await getClientProjects(clientId);
          if (res.success) setProjects(res.projects || []);
          else setError(res.message || "Projeler alınamadı");
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (projects.length && !selectedProjectId) {
      // Select the first active project by default if available
      const firstActive = projects.find(
        (p) => String(p.status).toLowerCase() !== "completed"
      );
      setSelectedProjectId(firstActive ? firstActive.id : projects[0].id);
    }
  }, [projects]);

  const filteredProjects = useMemo(() => {
    return projects
      .filter((p) => {
        const status = String(p.status || "").toLowerCase();
        const matchesFilter =
          projectFilter === "all"
            ? true
            : projectFilter === "completed"
            ? status === "completed"
            : projectFilter === "open"
            ? status === "open_for_bids"
            : projectFilter === "in_progress"
            ? status === "in_progress" || status === "pending_acceptance"
            : true;

        const matchesSearch = p.title
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

        return matchesFilter && matchesSearch;
      })
      .sort((a, b) => {
        // Sort by id descending (newest first)
        return b.id - a.id;
      });
  }, [projects, projectFilter, searchTerm]);

  const selectedProject = useMemo(
    () => projects.find((p) => p.id === selectedProjectId) || null,
    [projects, selectedProjectId]
  );

  const getStatusBadge = (status?: string) => {
    const s = String(status || "").toLowerCase();
    switch (s) {
      case "open_for_bids":
        return {
          label: "Tekliflere Açık",
          classes: "bg-green-100 text-green-700 border-green-200",
        };
      case "completed":
        return {
          label: "Tamamlandı",
          classes: "bg-gray-100 text-gray-600 border-gray-200",
        };
      case "in_progress":
        return {
          label: "Aktif / Sürüyor",
          classes: "bg-blue-100 text-blue-700 border-blue-200",
        };
      case "pending_acceptance":
        return {
          label: "Onay Bekliyor",
          classes: "bg-yellow-100 text-yellow-700 border-yellow-200",
        };
      case "cancelled":
        return {
          label: "İptal Edildi",
          classes: "bg-red-100 text-red-700 border-red-200",
        };
      default:
        return {
          label: s,
          classes: "bg-gray-100 text-gray-700 border-gray-200",
        };
    }
  };

  const formatCurrency = (value: any) => {
    const num = Number(value);
    return Number.isFinite(num) ? `${num.toLocaleString()}₺` : "-";
  };

  const openEditProject = (p: ClientProject) => {
    navigate(`/client/projects/${p.id}/edit`);
  };

  // Helper: compute if a project is eligible to be marked as completed
  const checkProjectCompletion = async (projectId: number) => {
    // If computing or already computed and not loading, skip re-fetch to reduce load
    const current = completionState[projectId];
    if (
      current &&
      (current.loading || (!current.loading && current.reason !== undefined))
    )
      return;

    setCompletionState((prev) => ({
      ...prev,
      [projectId]: {
        ...(prev[projectId] || {}),
        loading: true,
        canComplete: false,
      },
    }));

    try {
      const msRes = await getProjectMilestones(projectId);
      if (!msRes.success) {
        setCompletionState((prev) => ({
          ...prev,
          [projectId]: {
            ...(prev[projectId] || {}),
            loading: false,
            canComplete: false,
            reason: msRes.message || "Aşamalar alınamadı",
          },
        }));
        return;
      }

      const milestones = msRes.milestones || [];
      if (milestones.length === 0) {
        setCompletionState((prev) => ({
          ...prev,
          [projectId]: {
            ...(prev[projectId] || {}),
            loading: false,
            canComplete: false,
            reason: "Tamamlanacak aşama bulunmuyor",
          },
        }));
        return;
      }

      // All milestones must be approved
      const notApproved = milestones.filter((m) => {
        const status = String(m.status).toLowerCase();
        return status !== "approved" && status !== "completed";
      });
      if (notApproved.length > 0) {
        setCompletionState((prev) => ({
          ...prev,
          [projectId]: {
            ...(prev[projectId] || {}),
            loading: false,
            canComplete: false,
            reason: "Tüm aşamalar onaylanmadı",
          },
        }));
        return;
      }

      // For each milestone, ensure completed payments cover the milestone amount
      let allPaid = true;
      for (const m of milestones) {
        const payRes = await getPaymentsByMilestone(m.id);
        const payments: PaymentItem[] = payRes.success
          ? payRes.payments || []
          : [];
        const completedTotal = payments
          .filter((p) => {
            const s = String(p.status).toLowerCase();
            return s === "completed" || s === "released";
          })
          .reduce((sum, p) => sum + Number(p.amount || 0), 0);
        if (completedTotal < Number(m.amount || 0)) {
          allPaid = false;
          break;
        }
      }

      if (!allPaid) {
        setCompletionState((prev) => ({
          ...prev,
          [projectId]: {
            ...(prev[projectId] || {}),
            loading: false,
            canComplete: false,
            reason: "Tüm ödemeler tamamlanmadı",
          },
        }));
        return;
      }

      setCompletionState((prev) => ({
        ...prev,
        [projectId]: {
          ...(prev[projectId] || {}),
          loading: false,
          canComplete: true,
          reason: undefined,
        },
      }));
    } catch (e) {
      setCompletionState((prev) => ({
        ...prev,
        [projectId]: {
          ...(prev[projectId] || {}),
          loading: false,
          canComplete: false,
          reason: "Sunucu hatası veya bağlantı sorunu",
        },
      }));
    }
  };

  const handleCompleteProject = async (id: number) => {
    // show spinner while waiting for server
    setCompletionState((prev) => ({
      ...prev,
      [id]: { ...(prev[id] || {}), completing: true, error: undefined },
    }));
    try {
      const res = await updateProject(id, { status: "completed" } as any);
      if (res.success) {
        setProjects((prev) =>
          prev.map((p) =>
            p.id === id ? ({ ...p, status: "completed" } as any) : p
          )
        );
        // close menu when done
        setActionMenuProjectId(null);
      } else {
        setCompletionState((prev) => ({
          ...prev,
          [id]: {
            ...(prev[id] || {}),
            completing: false,
            error: res.message || "Tamamlanamadı",
          },
        }));
        return;
      }
    } catch (e: any) {
      setCompletionState((prev) => ({
        ...prev,
        [id]: {
          ...(prev[id] || {}),
          completing: false,
          error: e?.message || "Sunucu hatası",
        },
      }));
      return;
    }
    // clear spinner
    setCompletionState((prev) => ({
      ...prev,
      [id]: { ...(prev[id] || {}), completing: false },
    }));
  };

  const handleDeleteProject = async (id: number) => {
    const res = await deleteProject(id);
    if (res.success) {
      setProjects((prev) => prev.filter((p) => p.id !== id));
      toastSuccess("Proje başarıyla silindi");
    } else {
      toastError(res.message || "Proje silinemedi");
    }
  };

  if (loading) return <Loader overlay text="Projeler yükleniyor" />;
  if (error)
    return (
      <div className="p-3 mb-4 bg-red-50 text-red-700 rounded">{error}</div>
    );

  return (
    <div className="space-y-8 pb-12">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {/* Filters and Search */}
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-t-xl">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
            {(
              [
                { key: "all", label: "Tümü" },
                { key: "open", label: "Açık" },
                { key: "in_progress", label: "Aktif" },
                { key: "completed", label: "Tamamlanan" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setProjectFilter(tab.key)}
                className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  projectFilter === tab.key
                    ? "bg-white text-blue-600 shadow-sm ring-1 ring-gray-200"
                    : "text-gray-600 hover:bg-gray-200 hover:text-gray-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="relative w-full md:w-64">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Proje ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
        </div>

        {/* Projects Grid */}
        <div className="p-6">
          {filteredProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((p) => {
                const badge = getStatusBadge(p.status as any);
                const isSelected = selectedProjectId === p.id;
                const isMenuOpen = actionMenuProjectId === p.id;

                return (
                  <div
                    key={p.id}
                    className={`relative group bg-white border rounded-xl transition-all duration-200 ${
                      isSelected
                        ? "ring-2 ring-blue-500 border-transparent shadow-md"
                        : "border-gray-200 hover:shadow-lg hover:border-blue-300"
                    } ${isMenuOpen ? "z-30" : "z-0"}`}
                  >
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div
                          className={`p-2 rounded-lg ${
                            isSelected
                              ? "bg-blue-100 text-blue-600"
                              : "bg-gray-100 text-gray-500 group-hover:bg-blue-50 group-hover:text-blue-600"
                          }`}
                        >
                          <FiFolder className="w-6 h-6" />
                        </div>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${badge.classes}`}
                        >
                          {badge.label}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1">
                        {p.title}
                      </h3>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <FiDollarSign className="w-4 h-4 mr-2 text-gray-400" />
                          <span className="font-medium">
                            {formatCurrency((p as any).budget)}
                          </span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <FiCalendar className="w-4 h-4 mr-2 text-gray-400" />
                          <span>
                            {p.deadline
                              ? new Date(p.deadline as any).toLocaleDateString(
                                  "tr-TR"
                                )
                              : "-"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                        <Button
                          variant={isSelected ? "primary" : "outline"}
                          className="flex-1 text-xs py-2"
                          onClick={() => setSelectedProjectId(p.id)}
                        >
                          {isSelected ? "Seçili" : "Teklifleri Gör"}
                        </Button>
                        <Button
                          variant="primary"
                          className="flex-1 text-xs py-2"
                          onClick={() =>
                            navigate(`/client/projects/${p.id}/milestones`)
                          }
                          title="Proje Detayları"
                        >
                          Detaylar
                        </Button>
                        <div className="relative">
                          <button
                            className="p-2 rounded-md hover:bg-gray-100 text-gray-500 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              const nextOpen =
                                actionMenuProjectId === p.id ? null : p.id;
                              setActionMenuProjectId(nextOpen);
                              if (nextOpen) checkProjectCompletion(p.id);
                            }}
                          >
                            <FiMoreVertical />
                          </button>
                          {actionMenuProjectId === p.id && (
                            <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-20 overflow-hidden">
                              <div className="py-1">
                                <button
                                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                  onClick={() => {
                                    setActionMenuProjectId(null);
                                    openEditProject(p);
                                  }}
                                >
                                  Düzenle
                                </button>
                                <button
                                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 transition-colors ${
                                    completionState[p.id]?.loading ||
                                    completionState[p.id]?.completing
                                      ? "opacity-70 cursor-wait text-gray-500"
                                      : completionState[p.id]?.canComplete ===
                                        false
                                      ? "opacity-50 cursor-not-allowed text-gray-400"
                                      : "text-green-600 hover:bg-green-50"
                                  }`}
                                  disabled={
                                    completionState[p.id]?.loading ||
                                    completionState[p.id]?.canComplete ===
                                      false ||
                                    completionState[p.id]?.completing === true
                                  }
                                  onClick={() => {
                                    if (
                                      !completionState[p.id]?.loading &&
                                      completionState[p.id]?.canComplete !==
                                        false
                                    ) {
                                      handleCompleteProject(p.id);
                                    }
                                  }}
                                >
                                  {completionState[p.id]?.completing ? (
                                    <>
                                      <FiLoader className="animate-spin" />
                                      <span>İşleniyor...</span>
                                    </>
                                  ) : (
                                    <span>Projeyi Tamamla</span>
                                  )}
                                </button>
                                <div className="border-t border-gray-100 my-1"></div>
                                <button
                                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                  onClick={() => {
                                    setActionMenuProjectId(null);
                                    setConfirmDeleteId(p.id);
                                  }}
                                >
                                  Projeyi Sil
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiFilter className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">
                Proje Bulunamadı
              </h3>
              <p className="text-gray-500">
                Arama kriterlerinize uygun proje bulunmamaktadır.
              </p>
              {projectFilter !== "all" && (
                <button
                  onClick={() => setProjectFilter("all")}
                  className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
                >
                  Tüm projeleri göster
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {selectedProject && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-blue-50/50 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">
                Teklifler: {selectedProject.title}
              </h3>
              <p className="text-sm text-gray-500">
                Bu projeye gelen teklifleri yönetin
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedProjectId(null)}
            >
              Kapat
            </Button>
          </div>
          <div className="p-6">
            <BidsList projectId={selectedProject.id} />
          </div>
        </div>
      )}

      {confirmDeleteId !== null && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Projeyi Sil
            </h3>
            <p className="text-gray-600 mb-6">
              Bu projeyi silmek istediğinize emin misiniz? Bu işlem geri
              alınamaz.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => setConfirmDeleteId(null)}
              >
                İptal
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={() => {
                  const id = confirmDeleteId as number;
                  setConfirmDeleteId(null);
                  handleDeleteProject(id);
                }}
              >
                Evet, Sil
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
