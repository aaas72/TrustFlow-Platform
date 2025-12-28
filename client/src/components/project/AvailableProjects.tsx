import { useEffect, useMemo, useState } from "react";
import {
  getOpenProjects,
  getProjectSkills,
  type ProjectListItem,
  type SkillItem,
} from "../../services/projectService";
import { getBids } from "../../services/bidService";
import { LoaderGate, ProjectsFilter, AvailableProjectCard } from "..";
import type { FilterValue, TimeFilter } from "./ProjectsFilter";

interface AvailableProjectsProps {
  onApplyToProject: (
    projectId: string,
    bid?: {
      amount: number;
      proposal: string;
      delivery_time?: number;
      deadline?: string;
    }
  ) => void;
}

export default function AvailableProjects({
  onApplyToProject,
}: AvailableProjectsProps) {
  const [appliedProjects, setAppliedProjects] = useState<Set<string>>(
    new Set()
  );
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterValue>({
    name: "",
    domain: "",
    time: "any",
  });

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    getOpenProjects()
      .then((res) => {
        if (!mounted) return;
        if (res.success) {
          const base = res.projects || [];
          setProjects(base);
          // Fetch skills for each project
          Promise.all(base.map((p) => getProjectSkills(p.id)))
            .then((results) => {
              if (!mounted) return;
              const withSkills: ProjectListItem[] = base.map((p, idx) => ({
                ...p,
                skills: results[idx]?.skills || [],
              }));
              setProjects(withSkills);
            })
            .catch(() => {
              /* ignore skills errors */
            });

          // Fetch existing bids of the logged-in freelancer to disable Başvur
          getBids()
            .then((bRes) => {
              if (!mounted || !bRes?.success) return;
              const projectIds = new Set<string>(
                (bRes.bids || []).map((b: any) => String(b.project_id))
              );
              setAppliedProjects(projectIds);
            })
            .catch(() => {
              /* ignore */
            });
        } else {
          setError("Projeler alınamadı");
        }
      })
      .catch(() => mounted && setError("Projeler alınamadı"))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  // Mevcut projelerden alan (skill) seçeneklerini türet
  const domainOptions = useMemo(() => {
    const names = new Set<string>();
    for (const p of projects) {
      if (Array.isArray(p.skills)) {
        for (const s of p.skills) {
          const nm = (s?.name || "").trim();
          if (nm) names.add(nm);
        }
      }
    }
    return Array.from(names).sort((a, b) => a.localeCompare(b, "tr"));
  }, [projects]);

  // Zaman filtresi yardımcıları
  const isWithinTime = (createdAt?: string | null, t: TimeFilter = "any") => {
    if (!createdAt || t === "any") return true;
    const created = new Date(createdAt);
    if (Number.isNaN(created.getTime())) return true; // geçersiz tarihleri dışlama yerine göster
    const now = new Date();
    if (t === "today") {
      return created.toDateString() === now.toDateString();
    }
    const diffMs = now.getTime() - created.getTime();
    const dayMs = 24 * 60 * 60 * 1000;
    if (t === "7d") return diffMs <= 7 * dayMs;
    if (t === "30d") return diffMs <= 30 * dayMs;
    return true;
  };

  const filteredProjects = useMemo(() => {
    const nameQuery = filters.name.trim().toLowerCase();
    const domainQuery = filters.domain.trim().toLowerCase();
    return projects.filter((p) => {
      const matchesName = nameQuery
        ? String(p.title || "")
            .toLowerCase()
            .includes(nameQuery) ||
          String(p.description || "")
            .toLowerCase()
            .includes(nameQuery)
        : true;
      const matchesDomain = domainQuery
        ? Array.isArray(p.skills) &&
          p.skills.some(
            (s) => String(s?.name || "").toLowerCase() === domainQuery
          )
        : true;
      const matchesTime = isWithinTime(p.created_at, filters.time);
      return matchesName && matchesDomain && matchesTime;
    });
  }, [projects, filters]);

  const handleApply = (projectId: string) => {
    setAppliedProjects((prev) => new Set([...prev, projectId]));
    const p = projects.find((pr) => String(pr.id) === String(projectId));
    const amountNum =
      typeof p?.budget === "string" ? parseFloat(p!.budget) : p?.budget ?? 0;
    const safeAmount = Number.isFinite(Number(amountNum))
      ? Number(amountNum)
      : 0;
    const defaultProposal = `Merhaba, projeye katılmak istiyorum. Tahmini bütçe: ${
      safeAmount || "belirsiz"
    }.`;
    onApplyToProject(projectId, {
      amount: safeAmount,
      proposal: defaultProposal,
      delivery_time: 7,
      deadline: p?.deadline ?? undefined,
    });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("tr-TR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateOnly = (value?: string | null) => {
    if (!value) return "—";
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString("tr-TR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
    // Fallback for raw strings
    return value.includes("T") ? value.split("T")[0] : value;
  };

  const formatBudget = (budget?: number | string | null) => {
    if (budget === null || budget === undefined || budget === "") return "—";
    const n = typeof budget === "string" ? parseFloat(budget) : budget;
    if (Number.isNaN(Number(n))) return "—";
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      maximumFractionDigits: 2,
    }).format(Number(n));
  };

  return (
    <div className="space-y-6">
      {/* Filtreler */}
      <ProjectsFilter
        value={filters}
        onChange={setFilters}
        domains={domainOptions}
      />

      {error && (
        <div className="p-3 mb-4 bg-red-50 text-red-700 rounded">{error}</div>
      )}

      <LoaderGate loading={loading} text="Projeler yükleniyor...">
        <div className="grid gap-6">
          {filteredProjects.map((project) => (
            <AvailableProjectCard
              key={project.id}
              id={Number(project.id)}
              title={String(project.title || "")}
              budget={formatBudget(project.budget)}
              deadline={formatDateOnly(project.deadline)}
              skills={(project.skills || []).map((s: SkillItem) =>
                String(s.name || "")
              )}
              description={String(project.description || "")}
              clientName={
                project.client_name || `Müşteri #${project.client_id}`
              }
              postedDate={formatDate(project.created_at)}
              onApply={() => handleApply(String(project.id))}
              applied={appliedProjects.has(String(project.id))}
            />
          ))}
        </div>
      </LoaderGate>
    </div>
  );
}
