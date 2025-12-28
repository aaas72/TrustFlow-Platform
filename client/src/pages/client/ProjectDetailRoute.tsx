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
  fundMilestone,
} from "../../services";
import { getPlan, requestPlanRevision } from "../../services/planService";
import { socketService } from "../../services/socketService";
import type { Milestone } from "../../components/project/MilestoneSystem";

export interface ClientProjectDetailOutletContext {
  project: ProjectDetail;
  projectStatus?: string | null;
  planStatus?: "none" | "submitted" | "approved" | "revision_requested";
  plan?: {
    summary?: string;
    steps?: any[];
    review_note?: string | null;
  } | null;
  milestones: Milestone[];
  onApproveMilestone: (milestoneId: string) => Promise<boolean>;
  onRequestRevision: (milestoneId: string, notes: string) => Promise<boolean>;
  onFundMilestone: (milestoneId: string) => Promise<void>;
  onApprovePlan?: () => Promise<void>;
  onRequestPlanRevision?: (note: string) => Promise<void>;
}

export default function ClientProjectDetailRoute() {
  const params = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [projectStatus, setProjectStatus] = useState<string | null>(null);
  const [planStatus, setPlanStatus] = useState<
    "none" | "submitted" | "approved" | "revision_requested"
  >("none");
  const [plan, setPlan] = useState<{
    summary?: string;
    steps?: any[];
    review_note?: string | null;
  } | null>(null);

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
        setProjectStatus(String(res.project.status || null));
        setError(null);
      } else {
        setError(res.message || "Proje yüklenemedi");
      }
      setLoading(false);
    })();

    // Load plan
    (async () => {
      const r = await getPlan(id);
      if (r.success && r.plan) {
        const pj = r.plan.plan_json || {};
        setPlan({
          summary: pj.summary,
          steps: pj.steps || [],
          review_note: r.plan.review_note || null,
        });
        setPlanStatus((r.plan.status as any) || "none");
      } else {
        setPlan(null);
        setPlanStatus("none");
      }
    })();

    (async () => {
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
            console.log(`Mapping milestone ${m.id} attachments:`, attachments);
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

              // Append current auth token for API-served files to ensure preview works
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
            fundedAt: (m as any).fundedAt
              ? new Date((m as any).fundedAt)
              : undefined,
          };
        });
        setMilestones(fetchedMilestones);
      }
    })();
  }, [params.id]);

  // Socket listener for real-time milestone updates
  useEffect(() => {
    if (!project) return;

    const handleMilestoneStatus = (payload: any) => {
      if (Number(payload.project_id) === Number(project.id)) {
        const API_BASE =
          (typeof import.meta !== "undefined" &&
            (import.meta as any).env?.VITE_API_BASE_URL) ||
          "http://localhost:3000/api";
        const SERVER_ORIGIN = API_BASE.replace(/\/api\/?$/, "");

        setMilestones((prev) =>
          prev.map((m) => {
            if (m.id === String(payload.milestone_id)) {
              const updated = {
                ...m,
                status: payload.status,
                revisionNotes: payload.review_notes || m.revisionNotes,
                fundedAt:
                  payload.status === "funded" && payload.at
                    ? new Date(payload.at)
                    : m.fundedAt,
              };

              // Update attachments if present in payload (e.g. on submission)
              if (payload.attachments && Array.isArray(payload.attachments)) {
                updated.submittedFiles = payload.attachments.map(
                  (a: any) => a.file_name
                );
                updated.submittedFileLinks = payload.attachments.map(
                  (a: any) => {
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
                  }
                );
                updated.submittedAt = payload.at
                  ? new Date(payload.at)
                  : new Date();
              }
              return updated;
            }
            return m;
          })
        );
      }
    };

    socketService.on("milestone:status", handleMilestoneStatus);

    return () => {
      socketService.off("milestone:status", handleMilestoneStatus);
    };
  }, [project]);

  const handleBack = useCallback(() => {
    navigate("/client/projects");
  }, [navigate]);

  const onApproveMilestone = useCallback(async (milestoneId: string) => {
    const numericId = parseInt(milestoneId, 10);
    if (isNaN(numericId)) return false;
    const res = await updateMilestoneStatus(numericId, "approved");
    if (res.success) {
      setMilestones((prev) =>
        prev.map((m) =>
          m.id === milestoneId
            ? { ...m, status: "approved", approvedAt: new Date() }
            : m
        )
      );
      return true;
    } else {
      console.error(res.message || "Aşama onayı gerçekleştirilemedi");
      return false;
    }
  }, []);

  const onRequestRevision = useCallback(
    async (milestoneId: string, notes: string) => {
      const numericId = parseInt(milestoneId, 10);
      if (isNaN(numericId)) return false;
      const res = await updateMilestoneStatus(
        numericId,
        "revision_requested",
        notes
      );
      if (res.success) {
        setMilestones((prev) =>
          prev.map((m) =>
            m.id === milestoneId
              ? { ...m, status: "revision_requested", revisionNotes: notes }
              : m
          )
        );
        return true;
      } else {
        console.error(res.message || "Revizyon talebi başarısız");
        return false;
      }
    },
    []
  );

  const onFundMilestone = useCallback(async (milestoneId: string) => {
    const numericId = parseInt(milestoneId, 10);
    if (isNaN(numericId)) return;
    const res = await fundMilestone(numericId);
    if (res.success) {
      setMilestones((prev) =>
        prev.map((m) =>
          m.id === milestoneId
            ? {
                ...m,
                status: "funded",
                fundedAt: (res as any).funded_at
                  ? new Date((res as any).funded_at)
                  : new Date(),
              }
            : m
        )
      );
      // alert("Ödeme simülasyonu başarılı! Bakiye ayrıldı.");
    } else {
      console.error(res.message || "Ödeme başarısız");
      // Eğer zaten ödenmişse hata gösterme, durumu güncelle
      if (
        res.message &&
        res.message.toLowerCase().includes("already funded or paid")
      ) {
        setMilestones((prev) =>
          prev.map((m) =>
            m.id === milestoneId
              ? { ...m, status: "funded", fundedAt: new Date() }
              : m
          )
        );
      }
    }
  }, []);

  const onApprovePlan = useCallback(async () => {
    if (!project) return;
    const res = await approvePlan(Number(project.id));
    if (res.success) {
      setProjectStatus("in_progress");
      setPlanStatus("approved");

      // Refresh milestones as they might have been created
      const ms = await getProjectMilestones(Number(project.id));
      if (ms.success) {
        const API_BASE =
          (typeof import.meta !== "undefined" &&
            (import.meta as any).env?.VITE_API_BASE_URL) ||
          "http://localhost:3000/api";
        const SERVER_ORIGIN = API_BASE.replace(/\/api\/?$/, "");
        const fetchedMilestones: Milestone[] = ms.milestones.map((m) => {
          const attachments = m.attachments || [];
          return {
            id: m.id.toString(),
            title: m.title,
            description: m.description || "",
            amount: m.amount,
            status: m.status as any,
            deadline: m.deadline || undefined,
            deliverables: [],
            submittedFiles: attachments.map((a) => a.file_name),
            submittedFileLinks: attachments.map((a) => ({
              name: a.file_name,
              url: a.file_path
                ? `${SERVER_ORIGIN}/${a.file_path}`
                : String(a.url || "#"),
            })),
            revisionNotes: m.review_notes || undefined,
          };
        });
        setMilestones(fetchedMilestones);
      }
    } else {
      console.error(res.message || "Plan onayı gerçekleştirilemedi");
    }
  }, [project]);

  const onRequestPlanRevision = useCallback(
    async (note: string) => {
      if (!project) return;
      const r = await requestPlanRevision(Number(project.id), note);
      if (r.success) {
        setPlanStatus("revision_requested");
        setPlan((prev) => (prev ? { ...prev, review_note: note } : null));
      } else {
        console.error(r.message || "Plan için revizyon talebi başarısız");
      }
    },
    [project]
  );

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

        <ProjectTabs projectId={params.id!} basePath="/client/projects" />

        <Outlet
          context={
            {
              project: project as ProjectDetail,
              projectStatus: projectStatus ?? project.status,
              planStatus,
              plan,
              milestones,
              onApproveMilestone,
              onRequestRevision,
              onFundMilestone,
              onApprovePlan,
              onRequestPlanRevision,
            } satisfies ClientProjectDetailOutletContext
          }
        />
      </div>
    </div>
  );
}
