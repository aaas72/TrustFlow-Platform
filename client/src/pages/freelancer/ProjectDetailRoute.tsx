import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams, Outlet } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import ProjectTabs from "../../components/project/ProjectTabs";
import {
  getProjectById,
  getProjectSkills,
  type ProjectDetail,
} from "../../services/projectService";
import {
  getProjectMilestones,
  updateMilestoneStatus,
  approvePlan,
} from "../../services";
import { getPaymentsByMilestone } from "../../services/paymentService";
import { submitPlan } from "../../services/planService";
import type { Milestone } from "../../components/project/MilestoneSystem";
import type { EscrowTransaction } from "../../components/project/EscrowSystem";
import { socketService } from "../../services/socketService";

export interface ProjectDetailOutletContext {
  project: ProjectDetail;
  projectStatus: "accepted" | "plan_submitted" | "in_progress" | "completed";
  planStatus?: "none" | "submitted" | "approved" | "revision_requested";
  milestones: Milestone[];
  escrows: EscrowTransaction[];
  handlePlanSubmitted: (plan: {
    summary?: string;
    steps: any[];
  }) => Promise<void>;
  handleClientApprovePlan: () => Promise<void>;
  onSubmitMilestone: (milestoneId: string, files: string[]) => Promise<void>;
  refreshMilestones?: () => Promise<void>;
}

export default function ProjectDetailRoute() {
  const params = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projectStatus, setProjectStatus] = useState<
    "accepted" | "plan_submitted" | "in_progress" | "completed"
  >("accepted");
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [escrows, setEscrows] = useState<EscrowTransaction[]>([]);
  const [planStatus, setPlanStatus] = useState<
    "none" | "submitted" | "approved" | "revision_requested"
  >("none");

  const fetchMilestones = useCallback(async () => {
    const id = params.id ? parseInt(params.id, 10) : NaN;
    if (!id || Number.isNaN(id)) return;
    const ms = await getProjectMilestones(id);
    if (ms.success) {
      const API_BASE =
        (typeof import.meta !== "undefined" &&
          (import.meta as any).env?.VITE_API_BASE_URL) ||
        "http://localhost:3000/api";
      const SERVER_ORIGIN = API_BASE.replace(/\/api\/?$/, "");
      const fetchedMilestones: Milestone[] = ms.milestones.map((m) => ({
        id: m.id.toString(),
        title: m.title,
        description: m.description || "",
        amount: m.amount,
        status: m.status as any,
        estimatedDays: 0,
        deliverables: [],
        submittedFiles: (m.attachments || []).map((a) => a.file_name),
        submittedFileLinks: (m.attachments || [])
          .filter((a) => a.file_path || a.url)
          .map((a) => ({
            name: a.file_name,
            url: a.file_path
              ? `${SERVER_ORIGIN}/${a.file_path}`
              : String(a.url || "#"),
          })),
        revisionNotes: m.review_notes || undefined,
      }));
      // Fetch payments first to update milestone funded status and populate escrows
      const paymentResults = await Promise.all(
        fetchedMilestones.map(async (m) => {
          const res = await getPaymentsByMilestone(Number(m.id));
          return {
            milestoneId: m.id,
            payments: res.success ? res.payments || [] : [],
          };
        })
      );

      const allEscrows: EscrowTransaction[] = [];

      paymentResults.forEach(({ milestoneId, payments }) => {
        const mIndex = fetchedMilestones.findIndex((m) => m.id === milestoneId);
        if (mIndex !== -1) {
          // Check if funded
          const fundedPayment = payments.find((p) =>
            ["held", "released", "completed", "funded"].includes(
              String(p.status || "").toLowerCase()
            )
          );
          if (fundedPayment) {
            fetchedMilestones[mIndex].fundedAt = new Date(
              fundedPayment.created_at || Date.now()
            );
          }
        }

        // Map to EscrowTransaction
        payments.forEach((p) => {
          const mapStatus = (s: string): EscrowTransaction["status"] => {
            const v = String(s || "").toLowerCase();
            if (v === "completed") return "released";
            if (v === "released") return "released";
            if (v === "held") return "held";
            if (v === "funded") return "held";
            if (v === "pending") return "pending";
            return "refunded";
          };
          const m = fetchedMilestones.find((x) => x.id === milestoneId);
          allEscrows.push({
            id: String(p.id),
            milestoneId: milestoneId,
            milestoneName: m ? m.title : "",
            amount: Number(p.amount ?? 0),
            status: mapStatus(p.status as any),
            createdAt: new Date(p.created_at || Date.now()),
            releasedAt: p.paid_at ? new Date(p.paid_at) : undefined,
            description: `Ödeme Kaydı - ${m ? m.title : ""}`,
          });
        });
      });

      setMilestones(fetchedMilestones);
      setEscrows(allEscrows);
    }
  }, [params.id]);

  useEffect(() => {
    const id = params.id ? parseInt(params.id, 10) : NaN;
    if (!id || Number.isNaN(id)) {
      setError("Geçersiz proje kimliği");
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      const res = await getProjectById(id);
      if (res.success && res.project) {
        let proj = res.project;
        try {
          const skillsRes = await getProjectSkills(id);
          if (skillsRes.success) {
            proj = { ...proj, skills: skillsRes.skills.map((s) => s.name) };
          }
        } catch (e) {
          console.error("Skills fetch error", e);
        }
        setProject(proj);
        // Sunucudan gelen proje durumunu yerel duruma yansıt
        const s = String(res.project.status || "");
        if (
          ["accepted", "plan_submitted", "in_progress", "completed"].includes(s)
        ) {
          setProjectStatus(s as any);
        }
        setError(null);
      } else {
        setError(res.message || "Proje yüklenemedi");
      }
      setLoading(false);
    })();
    // Load plan status
    (async () => {
      const pr = await import("../../services/planService");
      const r = await pr.getPlan(id);
      if (r.success && r.plan) {
        setPlanStatus((r.plan.status as any) || "none");
      } else {
        setPlanStatus("none");
      }
    })();

    // Load existing milestones for project
    fetchMilestones();
  }, [params.id, fetchMilestones]);

  // Socket listener for real-time milestone updates
  useEffect(() => {
    if (!project) return;

    const handleMilestoneStatus = (payload: any) => {
      // Check if the update belongs to this project
      if (Number(payload.project_id) === Number(project.id)) {
        console.log("Received milestone status update:", payload);

        // If we have attachments in the payload, update immediately without fetch
        if (payload.attachments && Array.isArray(payload.attachments)) {
          const API_BASE =
            (typeof import.meta !== "undefined" &&
              (import.meta as any).env?.VITE_API_BASE_URL) ||
            "http://localhost:3000/api";
          const SERVER_ORIGIN = API_BASE.replace(/\/api\/?$/, "");

          setMilestones((prev) =>
            prev.map((m) => {
              if (m.id === String(payload.milestone_id)) {
                return {
                  ...m,
                  status: payload.status,
                  revisionNotes: payload.review_notes || m.revisionNotes,
                  submittedFiles: payload.attachments.map(
                    (a: any) => a.file_name
                  ),
                  submittedFileLinks: payload.attachments.map((a: any) => {
                    let url = a.file_path
                      ? `${SERVER_ORIGIN}/${a.file_path}`
                      : String(a.url || "#");
                    if (url.includes("/api/milestones/attachments/")) {
                      const token = localStorage.getItem("token");
                      if (token) {
                        url = url.replace(/[\?&]token=[^&]+/, "");
                        url += `${url.includes("?") ? "&" : "?"}token=${token}`;
                      }
                    }
                    return {
                      name: a.file_name,
                      url,
                    };
                  }),
                  submittedAt: payload.at ? new Date(payload.at) : new Date(),
                  fundedAt:
                    payload.status === "funded" && payload.at
                      ? new Date(payload.at)
                      : m.fundedAt,
                };
              }
              return m;
            })
          );
        } else {
          // Fallback to fetch if no attachments in payload
          fetchMilestones();
        }
      }
    };

    socketService.on("milestone:status", handleMilestoneStatus);

    return () => {
      socketService.off("milestone:status", handleMilestoneStatus);
    };
  }, [project, fetchMilestones]);

  const handleBack = useCallback(() => {
    navigate("/freelancer/current");
  }, [navigate]);

  const handlePlanSubmitted = useCallback(
    async (plan: { summary?: string; steps: any[] }) => {
      if (!project) return;
      const res = await submitPlan(Number(project.id), plan);
      if (res.success) {
        setProjectStatus("plan_submitted");
        setPlanStatus("submitted");
      } else {
        console.error(res.message || "Plan gönderilemedi");
      }
    },
    [project]
  );

  const handleClientApprovePlan = useCallback(async () => {
    if (!project) return;
    const res = await approvePlan(Number(project.id));
    if (res.success) {
      // Müşteri planı onayladı: plan durumunu ve proje durumunu güncelle
      setProjectStatus("in_progress");
      setPlanStatus("approved");
      setMilestones((prev) => {
        if (res.started_milestone) {
          const startedId = res.started_milestone.id.toString();
          return prev.map((m) =>
            m.id === startedId ? { ...m, status: "in_progress" } : m
          );
        }
        const idx = prev.findIndex(
          (m) => m.status === "pending" || m.status === "funded"
        );
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = { ...next[idx], status: "in_progress" };
          return next;
        }
        return prev;
      });
    } else {
      console.error(res.message);
    }
  }, [project]);

  const onSubmitMilestone = useCallback(
    async (milestoneId: string, files: string[]) => {
      const numericId = parseInt(milestoneId, 10);
      if (isNaN(numericId)) return;
      const response = await updateMilestoneStatus(numericId, "submitted");
      if (response.success) {
        setMilestones((prev) =>
          prev.map((m) =>
            m.id === milestoneId
              ? {
                  ...m,
                  status: "submitted",
                  submittedFiles: files,
                  submittedAt: new Date(),
                }
              : m
          )
        );
      }
    },
    []
  );

  const refreshMilestones = useCallback(async () => {
    const id = params.id ? parseInt(params.id, 10) : NaN;
    if (!id || Number.isNaN(id)) return;
    const ms = await getProjectMilestones(id);
    if (ms.success) {
      const API_BASE =
        (typeof import.meta !== "undefined" &&
          (import.meta as any).env?.VITE_API_BASE_URL) ||
        "http://localhost:3000/api";
      const SERVER_ORIGIN = API_BASE.replace(/\/api\/?$/, "");
      const fetchedMilestones: Milestone[] = ms.milestones.map((m) => {
        const attachments = m.attachments || [];
        if (attachments.length > 0) {
          console.log(
            `Mapping freelancer milestone ${m.id} attachments:`,
            attachments
          );
        }
        return {
          id: m.id.toString(),
          title: m.title,
          description: m.description || "",
          amount: m.amount,
          status: m.status as any,
          deadline: m.deadline || undefined,
          deliverables: [],
          submittedFiles: attachments.map((a) => a.file_name),
          submittedFileLinks: attachments.map((a) => {
            let url = a.file_path
              ? `${SERVER_ORIGIN}/${a.file_path}`
              : String(a.url || "#");

            if (url.includes("/api/milestones/attachments/")) {
              try {
                const token = localStorage.getItem("token");
                if (token) {
                  const urlObj = new URL(url);
                  urlObj.searchParams.set("token", token);
                  url = urlObj.toString();
                }
              } catch (e) {
                console.error("URL construction error:", e);
              }
            }
            return {
              name: a.file_name,
              url,
            };
          }),
          revisionNotes: m.review_notes || undefined,
        };
      });
      setMilestones(fetchedMilestones);
    }
  }, [params.id]);

  if (loading) {
    return <div className="p-6">Yükleniyor...</div>;
  }
  if (error) {
    return (
      <div className="p-6">
        <p className="text-red-600">{error}</p>
        <button
          onClick={handleBack}
          className="mt-4 px-4 py-2 rounded bg-blue-600 text-white"
        >
          Geri Dön
        </button>
      </div>
    );
  }
  if (!project) {
    return (
      <div className="p-6">
        <p className="text-gray-600">Proje bulunamadı.</p>
        <button
          onClick={handleBack}
          className="mt-4 px-4 py-2 rounded bg-blue-600 text-white"
        >
          Geri Dön
        </button>
      </div>
    );
  }

  // Tabs artık yeniden kullanılabilir bir bileşenle yönetiliyor

  return (
    <div className="p-6">
      <div className="container mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={handleBack}
            className="flex items-center text-gray-500 hover:text-blue-600 font-medium transition-colors"
          >
            <FiArrowLeft className="mr-2" />
            Projelere geri dön
          </button>
        </div>

        <ProjectTabs projectId={params.id!} />

        <Outlet
          context={
            {
              project: project as ProjectDetail,
              projectStatus,
              planStatus,
              milestones,
              escrows,
              handlePlanSubmitted,
              handleClientApprovePlan,
              onSubmitMilestone,
              refreshMilestones,
            } satisfies ProjectDetailOutletContext
          }
        />
      </div>
    </div>
  );
}
