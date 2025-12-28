import React, { useEffect, useMemo, useState } from "react";
import {
  FiPlus,
  FiTrash2,
  FiDollarSign,
  FiCalendar,
  FiFileText,
  FiCheckCircle,
  FiAlertCircle,
  FiClock,
} from "react-icons/fi";

interface MilestoneFormData {
  id: string;
  title: string;
  description: string;
  amount: number;
  estimatedDays: number;
  deliverables: string[];
  startDate?: string;
  endDate?: string;
}

interface ProjectPlanFormProps {
  projectTitle: string;
  projectDescription: string;
  projectBudget?: number;
  projectDeadline?: string;
  projectStartDate?: string;
  freelancerBidDeliveryDays?: number;
  acceptedBidAmount?: number;
  onSubmitPlan: (plan: {
    summary?: string;
    steps: MilestoneFormData[];
  }) => void;
  onCancel?: () => void;
  initialPlan?: { summary?: string; steps: any[] };
  submitLabel?: string;
  readOnly?: boolean;
  disableSubmit?: boolean;
  hideSubmit?: boolean;
}

function parseTurkishPlanSummary(summary?: string): Record<string, string> {
  if (!summary) return {};
  const keys = [
    "Plan Türü",
    "Plan Adı",
    "Toplam Tahmini Süre (Gün)",
    "Hedefler",
    "Kapsam",
    "Başarı Kriterleri",
    "Riskler ve Önlemler",
    "Varsayımlar",
    "Bağımlılıklar",
    "Araçlar/Teknolojiler",
    "Kalite Kontrolleri",
    "Genel Açıklama",
  ];
  const map: Record<string, string> = {};
  for (const k of keys) {
    const re = new RegExp(`${k}:\s*([^\n]+)`, "i");
    const m = summary.match(re);
    if (m) map[k] = m[1].trim();
  }
  return map;
}

const ProjectPlanForm: React.FC<ProjectPlanFormProps> = ({
  projectTitle,
  projectDescription,
  projectBudget,
  projectDeadline,
  projectStartDate,
  freelancerBidDeliveryDays,
  acceptedBidAmount,
  onSubmitPlan,
  onCancel,
  initialPlan,
  submitLabel,
  readOnly = false,
  disableSubmit = false,
  hideSubmit = false,
}) => {
  const initialParsed = useMemo(
    () => parseTurkishPlanSummary(initialPlan?.summary),
    [initialPlan?.summary]
  );

  const [milestones, setMilestones] = useState<MilestoneFormData[]>(
    Array.isArray(initialPlan?.steps) && initialPlan!.steps!.length > 0
      ? initialPlan!.steps!.map((s: any, idx: number) => ({
          id: String(s.id || idx + 1),
          title: String(s.title || ""),
          description: String(s.description || ""),
          amount: s.amount !== undefined ? Number(s.amount) : 0,
          estimatedDays:
            s.estimatedDays !== undefined ? Number(s.estimatedDays) : 0,
          deliverables: Array.isArray(s.deliverables)
            ? s.deliverables.map(String)
            : [""],
          startDate: s.startDate ? String(s.startDate) : "",
          endDate: s.endDate ? String(s.endDate) : "",
        }))
      : [
          {
            id: "1",
            title: "",
            description: "",
            amount: 0,
            estimatedDays: 0,
            deliverables: [""],
            startDate: "",
            endDate: "",
          },
        ]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [planType, setPlanType] = useState(initialParsed["Plan Türü"] || "");
  const [planName, setPlanName] = useState(initialParsed["Plan Adı"] || "");
  const [planSummary, setPlanSummary] = useState(
    initialParsed["Genel Açıklama"] || initialPlan?.summary || ""
  );
  const [totalEstimatedDays, setTotalEstimatedDays] = useState<number>(
    (() => {
      const v = initialParsed["Toplam Tahmini Süre (Gün)"];
      if (v) {
        const m = v.match(/\d+/);
        return m ? Number(m[0]) : 0;
      }
      return freelancerBidDeliveryDays || 0;
    })()
  );
  const [objectives, setObjectives] = useState(initialParsed["Hedefler"] || "");
  const [scope, setScope] = useState(initialParsed["Kapsam"] || "");
  const [successCriteria, setSuccessCriteria] = useState(
    initialParsed["Başarı Kriterleri"] || ""
  );
  const [risks, setRisks] = useState(
    initialParsed["Riskler ve Önlemler"] || ""
  );
  const [assumptions, setAssumptions] = useState(
    initialParsed["Varsayımlar"] || ""
  );
  const [dependencies, setDependencies] = useState(
    initialParsed["Bağımlılıklar"] || ""
  );
  const [tools, setTools] = useState(
    initialParsed["Araçlar/Teknolojiler"] || ""
  );
  const [qualityChecks, setQualityChecks] = useState(
    initialParsed["Kalite Kontrolleri"] || ""
  );
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Validation Errors state
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  // Sync freelancerBidDeliveryDays and enforce it
  useEffect(() => {
    if (freelancerBidDeliveryDays && freelancerBidDeliveryDays > 0) {
      setTotalEstimatedDays(freelancerBidDeliveryDays);
    }
  }, [freelancerBidDeliveryDays]);

  // Eğer toplam gün verilmemişse mevcut aşama günlerinden türet
  useEffect(() => {
    if (!totalEstimatedDays && !freelancerBidDeliveryDays) {
      const sum = milestones.reduce(
        (acc, m) => acc + (m.estimatedDays || 0),
        0
      );
      if (sum > 0) setTotalEstimatedDays(sum);
    }
  }, [milestones, totalEstimatedDays]);

  // Prefill when initialPlan arrives asynchronously
  useEffect(() => {
    // If it's a fresh form (1 empty milestone) and we have a budget, initialize it
    if (
      !initialPlan &&
      milestones.length === 1 &&
      milestones[0].amount === 0 &&
      projectBudget &&
      projectBudget > 0
    ) {
      setMilestones((prev) => [{ ...prev[0], amount: projectBudget }]);
    }
  }, [projectBudget]); // Only depend on projectBudget to run once when it becomes available

  useEffect(() => {
    if (!initialPlan) return;
    const isFormBlank =
      !planType &&
      !planName &&
      !planSummary &&
      milestones.length === 1 &&
      !milestones[0].title &&
      !milestones[0].description &&
      milestones[0].amount === 0 &&
      milestones[0].estimatedDays === 0 &&
      (!milestones[0].deliverables || milestones[0].deliverables.length <= 1);

    if (!isFormBlank) return; // avoid clobbering user edits

    const parsed = parseTurkishPlanSummary(initialPlan.summary);

    setPlanType(parsed["Plan Türü"] || "");
    setPlanName(parsed["Plan Adı"] || "");
    setPlanSummary(parsed["Genel Açıklama"] || initialPlan.summary || "");
    const v = parsed["Toplam Tahmini Süre (Gün)"];
    if (v) {
      const m = v.match(/\d+/);
      setTotalEstimatedDays(m ? Number(m[0]) : 0);
    }
    setObjectives(parsed["Hedefler"] || "");
    setScope(parsed["Kapsam"] || "");
    setSuccessCriteria(parsed["Başarı Kriterleri"] || "");
    setRisks(parsed["Riskler ve Önlemler"] || "");
    setAssumptions(parsed["Varsayımlar"] || "");
    setDependencies(parsed["Bağımlılıklar"] || "");
    setTools(parsed["Araçlar/Teknolojiler"] || "");
    setQualityChecks(parsed["Kalite Kontrolleri"] || "");

    if (Array.isArray(initialPlan.steps) && initialPlan.steps.length > 0) {
      const mapped = initialPlan.steps.map((s: any, idx: number) => {
        if (typeof s === "string") {
          return {
            id: String(idx + 1),
            title: s,
            description: "",
            amount: 0,
            estimatedDays: 0,
            deliverables: [""],
            startDate: "",
            endDate: "",
          } as MilestoneFormData;
        }
        return {
          id: String(s.id || idx + 1),
          title: String(s.title || ""),
          description: String(s.description || ""),
          amount: s.amount !== undefined ? Number(s.amount) : 0,
          estimatedDays:
            s.estimatedDays !== undefined ? Number(s.estimatedDays) : 0,
          deliverables: Array.isArray(s.deliverables)
            ? s.deliverables.map(String)
            : [""],
          startDate: s.startDate ? String(s.startDate) : "",
          endDate: s.endDate ? String(s.endDate) : "",
        } as MilestoneFormData;
      });
      setMilestones(mapped);
    }
  }, [initialPlan]);

  const redistributeBudget = (
    currentMilestones: MilestoneFormData[]
  ): MilestoneFormData[] => {
    if (!projectBudget || projectBudget <= 0) return currentMilestones;
    const count = currentMilestones.length;
    if (count === 0) return currentMilestones;

    const baseAmount = Math.floor(projectBudget / count);
    const remainder = projectBudget % count;

    return currentMilestones.map((m, idx) => ({
      ...m,
      amount: idx === count - 1 ? baseAmount + remainder : baseAmount,
    }));
  };

  const addMilestone = () => {
    const newMilestone: MilestoneFormData = {
      id: Date.now().toString(),
      title: "",
      description: "",
      amount: 0,
      estimatedDays: 0,
      deliverables: [""],
      startDate: "",
      endDate: "",
    };
    const nextMilestones = [...milestones, newMilestone];
    setMilestones(redistributeBudget(nextMilestones));
  };

  const removeMilestone = (id: string) => {
    if (milestones.length > 1) {
      const nextMilestones = milestones.filter((m) => m.id !== id);
      setMilestones(redistributeBudget(nextMilestones));
    }
  };

  const updateMilestone = (
    id: string,
    field: keyof MilestoneFormData | null,
    value: any
  ) => {
    if (field === null && typeof value === "object") {
      // Bulk update
      setMilestones(
        milestones.map((m) => (m.id === id ? { ...m, ...value } : m))
      );
    } else if (field) {
      // Single field update
      setMilestones(
        milestones.map((m) => (m.id === id ? { ...m, [field]: value } : m))
      );
    }
  };

  const addDeliverable = (milestoneId: string) => {
    setMilestones(
      milestones.map((m) =>
        m.id === milestoneId
          ? { ...m, deliverables: [...m.deliverables, ""] }
          : m
      )
    );
  };

  const updateDeliverable = (
    milestoneId: string,
    index: number,
    value: string
  ) => {
    setMilestones(
      milestones.map((m) =>
        m.id === milestoneId
          ? {
              ...m,
              deliverables: m.deliverables.map((d, i) =>
                i === index ? value : d
              ),
            }
          : m
      )
    );
  };

  const removeDeliverable = (milestoneId: string, index: number) => {
    setMilestones(
      milestones.map((m) =>
        m.id === milestoneId
          ? { ...m, deliverables: m.deliverables.filter((_, i) => i !== index) }
          : m
      )
    );
  };

  const validateForm = () => {
    // Reset errors derived from basic validation if we wanted,
    // but here we just return bool.
    // Ideally we should move all validation logic to a single place or use the state.
    // For now, let's keep basic required field checks here for the disabled button state.

    if (!planType.trim()) return false;
    if (!planName.trim()) return false;
    if (!planSummary.trim()) return false;
    if (!totalEstimatedDays || totalEstimatedDays <= 0) return false;

    // Budget and Deadline validation
    const currentTotalAmount = milestones.reduce(
      (sum, m) => sum + (m.amount || 0),
      0
    );
    if (projectBudget && currentTotalAmount > projectBudget) {
      // We will handle specific error messages in handleSubmit, here just return false or let it pass and fail later with message
      // But validateForm is boolean. Let's make handleSubmit handle the alerting for specific errors.
    }

    // Advanced fields are optional
    for (const milestone of milestones) {
      if (!milestone.title.trim()) return false;
      if (!milestone.description.trim()) return false;
      if (milestone.amount <= 0) return false;
      if (milestone.estimatedDays <= 0) return false;
      if (!milestone.startDate || !milestone.endDate) return false;
      const sd = new Date(milestone.startDate as string);
      const ed = new Date(milestone.endDate as string);
      if (ed.getTime() < sd.getTime()) return false;

      // Check against project deadline
      if (projectDeadline) {
        const pDeadline = new Date(projectDeadline);
        if (ed.getTime() > pDeadline.getTime()) {
          // specific error handled in handleSubmit
        }
      }

      if (
        milestone.deliverables.length === 0 ||
        !milestone.deliverables.some((d) => d.trim())
      )
        return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    // Reset specific errors before checking
    setValidationErrors({});
    let hasError = false;
    const newErrors: Record<string, string> = {};

    // Custom Validations with Messages
    const currentTotalAmount = milestones.reduce(
      (sum, m) => sum + (m.amount || 0),
      0
    );

    const maxBudget = acceptedBidAmount || projectBudget;
    if (maxBudget && currentTotalAmount > maxBudget) {
      newErrors["budget"] = `Toplam aşama ücreti (${currentTotalAmount} TL), ${
        acceptedBidAmount ? "kabul edilen teklif tutarını" : "proje bütçesini"
      } (${maxBudget} TL) aşamaz.`;
      hasError = true;
    }

    if (freelancerBidDeliveryDays && freelancerBidDeliveryDays > 0) {
      if (totalEstimatedDays > freelancerBidDeliveryDays) {
        newErrors[
          "totalDays"
        ] = `Toplam tahmini süre (${totalEstimatedDays} gün), teklif süresini (${freelancerBidDeliveryDays} gün) aşamaz.`;
        hasError = true;
      }

      const currentTotalDays = milestones.reduce(
        (sum, m) => sum + (m.estimatedDays || 0),
        0
      );
      if (currentTotalDays > freelancerBidDeliveryDays) {
        newErrors[
          "milestoneDays"
        ] = `Aşamaların toplam süresi (${currentTotalDays} gün), teklif süresini (${freelancerBidDeliveryDays} gün) aşamaz.`;
        hasError = true;
      }
    }

    // Deadline Validation Logic
    let deadlineDate: Date | null = null;
    let deadlineLabel = "";

    if (freelancerBidDeliveryDays && freelancerBidDeliveryDays > 0) {
      // Prioritize Accepted Bid Duration
      // Calculate Deadline based on the EARLIEST start date in the plan (User's visible start date)
      // If no start date is set yet, fall back to projectStartDate

      let basisDate: Date | null = null;

      // Find earliest start date from milestones
      const validStartDates = milestones
        .map((m) => (m.startDate ? new Date(m.startDate).getTime() : null))
        .filter((t) => t !== null) as number[];

      if (validStartDates.length > 0) {
        basisDate = new Date(Math.min(...validStartDates));
      } else if (projectStartDate) {
        basisDate = new Date(projectStartDate);
      }

      if (basisDate) {
        basisDate.setHours(0, 0, 0, 0);
        const d = new Date(basisDate);
        // Add days (Simple addition: 12 + 19 = 31)
        d.setDate(basisDate.getDate() + freelancerBidDeliveryDays);
        deadlineDate = d;
        deadlineLabel = `teslim süresi bitişini (${d.toLocaleDateString(
          "tr-TR"
        )})`;
      }
    } else if (projectDeadline) {
      // Fallback to Project Deadline
      deadlineDate = new Date(projectDeadline);
      deadlineLabel = `proje teslim tarihini (${deadlineDate.toLocaleDateString(
        "tr-TR"
      )})`;
    }

    if (deadlineDate) {
      // Normalize deadline to YYYY-MM-DD string for comparison
      const deadlineStr = deadlineDate.toISOString().split("T")[0];

      milestones.forEach((m) => {
        if (m.endDate) {
          if (m.endDate > deadlineStr) {
            newErrors[
              `milestone-${m.id}-endDate`
            ] = `Aşama bitiş tarihi, ${deadlineLabel} geçemez.`;
            hasError = true;
          }
        }
      });
    }

    if (projectStartDate) {
      const pStart = new Date(projectStartDate);
      // Normalize to start of day
      pStart.setHours(0, 0, 0, 0);

      milestones.forEach((m) => {
        if (m.startDate) {
          const mStart = new Date(m.startDate);
          mStart.setHours(0, 0, 0, 0);

          if (mStart.getTime() < pStart.getTime()) {
            newErrors[
              `milestone-${m.id}-startDate`
            ] = `Aşama başlangıç tarihi, proje onay tarihinden (${new Date(
              projectStartDate
            ).toLocaleDateString("tr-TR")}) önce olamaz.`;
            hasError = true;
          }
        }
      });
    }

    // General Milestone Validation (Capacity Rule & Date Logic)
    milestones.forEach((m) => {
      if (m.startDate && m.endDate) {
        const start = new Date(m.startDate);
        const end = new Date(m.endDate);

        // Normalize time to midnight to ensure accurate day difference
        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);

        if (end.getTime() < start.getTime()) {
          newErrors[`milestone-${m.id}-endDate`] =
            "Bitiş tarihi başlangıç tarihinden önce olamaz.";
          hasError = true;
        } else if (m.estimatedDays > 0) {
          // Calculate diff in days (inclusive: start date counts as day 1)
          const diffTime = end.getTime() - start.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

          if (diffDays < m.estimatedDays) {
            newErrors[
              `milestone-${m.id}-estimatedDays`
            ] = `Belirtilen tarih aralığı (${diffDays} gün), tahmini süre (${m.estimatedDays} gün) için yetersiz.`;
            // Also flag the end date to draw attention
            newErrors[`milestone-${m.id}-endDate`] = "Süre yetersiz.";
            hasError = true;
          }
        }
      }
    });

    if (hasError) {
      setValidationErrors(newErrors);
      return;
    }

    setSuccessMessage(null);
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      const cleanedMilestones = milestones.map((m) => ({
        ...m,
        deliverables: m.deliverables.filter((d) => d.trim()),
      }));

      const composedSummary = [
        `Plan Türü: ${planType}`,
        `Plan Adı: ${planName}`,
        `Toplam Tahmini Süre (Gün): ${totalEstimatedDays}`,
        `Hedefler: ${objectives}`,
        `Kapsam: ${scope}`,
        `Başarı Kriterleri: ${successCriteria}`,
        risks.trim() ? `Riskler ve Önlemler: ${risks}` : undefined,
        assumptions.trim() ? `Varsayımlar: ${assumptions}` : undefined,
        dependencies.trim() ? `Bağımlılıklar: ${dependencies}` : undefined,
        tools.trim() ? `Araçlar/Teknolojiler: ${tools}` : undefined,
        qualityChecks.trim()
          ? `Kalite Kontrolleri: ${qualityChecks}`
          : undefined,
        `Genel Açıklama: ${planSummary}`,
      ]
        .filter(Boolean)
        .join("\n");

      await onSubmitPlan({
        summary: composedSummary,
        steps: cleanedMilestones,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalAmount = milestones.reduce((sum, m) => sum + m.amount, 0);
  const totalDays = milestones.reduce((sum, m) => sum + m.estimatedDays, 0);

  return (
    <div className="mx-auto p-4 bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-800 to-blue-600 text-white p-6 rounded-t-lg">
        <h2 className="text-2xl font-bold mb-2">
          Project Plan Sunumu - Şeffaf Yol Haritası Oluşturun
        </h2>
        <p className="text-purple-100">
          Projeyi aşamalara bölerek müşterinize net bir çalışma planı sunun
        </p>
      </div>

      {/* Project Info */}
      <div className="p-6 border-b border-gray-200 bg-gray-50">
        <h3 className="font-semibold text-gray-900 mb-2">{projectTitle}</h3>
        <p className="text-gray-600 text-sm">{projectDescription}</p>
        {errorMessage && (
          <div className="mt-4 p-3 bg-red-50 text-red-700 rounded">
            {errorMessage}
          </div>
        )}
        {successMessage && (
          <div className="mt-4 p-3 bg-green-50 text-green-700 rounded">
            {successMessage}
          </div>
        )}
      </div>

      <fieldset
        disabled={readOnly}
        className={readOnly ? "opacity-90" : undefined}
      >
        <div className="p-6 border-b border-gray-200">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Plan Detayları
            </h3>
            <p className="text-gray-600 text-sm">
              Plan alanlarını doldurarak çalışmaya başlamadan net bir çerçeve
              oluşturun.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Plan Türü *
              </label>
              <input
                type="text"
                value={planType}
                onChange={(e) => setPlanType(e.target.value)}
                placeholder="Örnek: Tasarım ve Geliştirme, Araştırma ve Analiz, Aşamalı Uygulama"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Plan Adı *
              </label>
              <input
                type="text"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                placeholder="Örnek: 6 Haftada Kurumsal Web Sitesi Uygulama Planı"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Toplam Tahmini Süre (Gün) *
              </label>
              <input
                type="number"
                value={totalEstimatedDays || ""}
                onChange={(e) =>
                  !freelancerBidDeliveryDays &&
                  setTotalEstimatedDays(parseInt(e.target.value) || 0)
                }
                readOnly={!!freelancerBidDeliveryDays}
                disabled={!!freelancerBidDeliveryDays}
                placeholder="Örnek: 30"
                className={`w-full p-2 border ${
                  validationErrors["totalDays"]
                    ? "border-red-500"
                    : "border-gray-300"
                } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  freelancerBidDeliveryDays
                    ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                    : ""
                }`}
              />
              {freelancerBidDeliveryDays && (
                <p className="mt-1 text-xs text-gray-500">
                  * Bu süre kabul edilen teklifinizdeki teslim süresidir,
                  değiştirilemez.
                </p>
              )}
              {validationErrors["totalDays"] && (
                <p className="mt-1 text-sm text-red-600">
                  {validationErrors["totalDays"]}
                </p>
              )}
            </div>
            <div>
              <label className="block text sm font-medium text-gray-700 mb-1">
                Planın Genel Açıklaması *
              </label>
              <textarea
                value={planSummary}
                onChange={(e) => setPlanSummary(e.target.value)}
                placeholder="Çalışma yöntemini, standartları, araçları ve kontrol/kalite noktalarını özetleyin"
                rows={3}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
            </div>
          </div>
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FiCheckCircle className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Gelişmiş Bilgiler (İsteğe bağlı)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAdvanced((v) => !v)}
                className="px-3 py-1 text-sm rounded-lg border border-gray-300 hover:bg-gray-100"
              >
                {showAdvanced ? "Gizle" : "Göster"}
              </button>
            </div>
            {showAdvanced ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hedefler *
                  </label>
                  <textarea
                    value={objectives}
                    onChange={(e) => setObjectives(e.target.value)}
                    placeholder="Projenin iş hedeflerini ve beklenen sonuçları tanımlayın"
                    rows={3}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kapsam *
                  </label>
                  <textarea
                    value={scope}
                    onChange={(e) => setScope(e.target.value)}
                    placeholder="Dahil olan ve olmayan işleri, teslimatları ve sınırları belirtin"
                    rows={3}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Başarı Kriterleri *
                  </label>
                  <textarea
                    value={successCriteria}
                    onChange={(e) => setSuccessCriteria(e.target.value)}
                    placeholder="Kabul kriterlerini ve başarı ölçütlerini yazın"
                    rows={3}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Riskler ve Önlemler
                  </label>
                  <textarea
                    value={risks}
                    onChange={(e) => setRisks(e.target.value)}
                    placeholder="Teknik, zaman ve kaynak risklerini; alınacak önlemleri yazın"
                    rows={3}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Varsayımlar
                  </label>
                  <textarea
                    value={assumptions}
                    onChange={(e) => setAssumptions(e.target.value)}
                    placeholder="Planın dayandığı varsayımları ve ön koşulları yazın"
                    rows={3}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bağımlılıklar
                  </label>
                  <textarea
                    value={dependencies}
                    onChange={(e) => setDependencies(e.target.value)}
                    placeholder="Dış sistemler, onaylar ve diğer ekip çalışmalarına bağımlılıklar"
                    rows={3}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Araçlar / Teknolojiler
                  </label>
                  <textarea
                    value={tools}
                    onChange={(e) => setTools(e.target.value)}
                    placeholder="Kullanılacak teknoloji, araç ve altyapıları listeleyin"
                    rows={3}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kalite Kontrolleri
                  </label>
                  <textarea
                    value={qualityChecks}
                    onChange={(e) => setQualityChecks(e.target.value)}
                    placeholder="Test, doğrulama ve gözden geçirme adımlarını belirtin"
                    rows={3}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-600">
                Bu bölüm planı zenginleştirmek için isteğe bağlı ayrıntıları
                içerir.
              </p>
            )}
          </div>
        </div>

        {/* Form Content */}
        <div className="p-6">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <FiFileText className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Proje Aşamalarını Tanımlayın
              </h3>
            </div>
            <p className="text-gray-600 text-sm">
              Her aşama için net teslimatlar, süre ve ücret bilgileri 0'dan
              büyük olmalı. Bu bilgiler müşteriye şeffaf bir çalışma planı
              sunar.
            </p>
          </div>

          {/* Milestones */}
          <div className="space-y-6">
            {milestones.map((milestone, index) => (
              <div
                key={milestone.id}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-900">
                    Aşama {index + 1}
                  </h4>
                  {milestones.length > 1 && (
                    <button
                      onClick={() => removeMilestone(milestone.id)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Aşama Başlığı *
                    </label>
                    <input
                      type="text"
                      value={milestone.title}
                      onChange={(e) =>
                        updateMilestone(milestone.id, "title", e.target.value)
                      }
                      placeholder="Örn: Wireframe Tasarımı"
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ücret (TL) *
                      </label>
                      <div className="relative">
                        <FiDollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="number"
                          value={milestone.amount || ""}
                          onChange={(e) => {
                            updateMilestone(
                              milestone.id,
                              "amount",
                              parseInt(e.target.value) || 0
                            );
                            // Clear budget error on change if needed, or wait for submit
                            if (validationErrors["budget"]) {
                              setValidationErrors((prev) => {
                                const next = { ...prev };
                                delete next["budget"];
                                return next;
                              });
                            }
                          }}
                          placeholder="1000"
                          className={`w-full pl-10 p-2 border ${
                            validationErrors["budget"]
                              ? "border-red-500"
                              : "border-gray-300"
                          } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Süre (Gün) *
                      </label>
                      <div className="relative">
                        <FiClock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="number"
                          value={milestone.estimatedDays || ""}
                          onChange={(e) => {
                            const days = parseInt(e.target.value) || 0;
                            const updates: Partial<MilestoneFormData> = {
                              estimatedDays: days,
                            };

                            if (milestone.startDate && days > 0) {
                              const start = new Date(milestone.startDate);
                              const end = new Date(start);
                              // Subtract 1 day because start date is included in duration
                              // Example: Start 12th, Duration 1 day -> End 12th (12 + 1 - 1)
                              end.setDate(start.getDate() + days - 1);
                              updates.endDate = end.toISOString().split("T")[0];

                              // Clear end date error if it exists (since we auto-calculated a valid one potentially)
                              // But we need to check validation again.
                              if (
                                validationErrors[
                                  `milestone-${milestone.id}-endDate`
                                ]
                              ) {
                                setValidationErrors((prev) => {
                                  const next = { ...prev };
                                  delete next[
                                    `milestone-${milestone.id}-endDate`
                                  ];
                                  return next;
                                });
                              }
                            }

                            updateMilestone(milestone.id, null, updates);
                          }}
                          placeholder="5"
                          className={`w-full pl-10 p-2 border ${
                            validationErrors[
                              `milestone-${milestone.id}-estimatedDays`
                            ]
                              ? "border-red-500"
                              : "border-gray-300"
                          } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                        />
                      </div>
                      {validationErrors[
                        `milestone-${milestone.id}-estimatedDays`
                      ] && (
                        <p className="mt-1 text-sm text-red-600">
                          {
                            validationErrors[
                              `milestone-${milestone.id}-estimatedDays`
                            ]
                          }
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Schedule Dates */}
                <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Aşama Başlangıç Tarihi *
                    </label>
                    <div className="relative">
                      <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="date"
                        value={milestone.startDate || ""}
                        onChange={(e) => {
                          const newStartDate = e.target.value;
                          const updates: Partial<MilestoneFormData> = {
                            startDate: newStartDate,
                          };

                          // If we have duration, shift end date
                          if (
                            milestone.estimatedDays &&
                            milestone.estimatedDays > 0 &&
                            newStartDate
                          ) {
                            const start = new Date(newStartDate);
                            const end = new Date(start);
                            // Subtract 1 day for inclusive duration
                            end.setDate(
                              start.getDate() + milestone.estimatedDays - 1
                            );
                            updates.endDate = end.toISOString().split("T")[0];
                          } else if (milestone.endDate && newStartDate) {
                            // If we have end date but no duration, calculate duration
                            const start = new Date(newStartDate);
                            const end = new Date(milestone.endDate);
                            const diffTime = end.getTime() - start.getTime();
                            // Add 1 day for inclusive count
                            const diffDays =
                              Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                            if (diffDays >= 0) {
                              updates.estimatedDays = diffDays;
                            }
                          }

                          updateMilestone(milestone.id, null, updates);

                          if (
                            validationErrors[
                              `milestone-${milestone.id}-startDate`
                            ]
                          ) {
                            setValidationErrors((prev) => {
                              const next = { ...prev };
                              delete next[
                                `milestone-${milestone.id}-startDate`
                              ];
                              return next;
                            });
                          }
                        }}
                        className={`w-full pl-10 p-2 border ${
                          validationErrors[
                            `milestone-${milestone.id}-startDate`
                          ]
                            ? "border-red-500"
                            : "border-gray-300"
                        } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                      />
                    </div>
                    {validationErrors[
                      `milestone-${milestone.id}-startDate`
                    ] && (
                      <p className="mt-1 text-sm text-red-600">
                        {
                          validationErrors[
                            `milestone-${milestone.id}-startDate`
                          ]
                        }
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Aşama Bitiş Tarihi *
                    </label>
                    <div className="relative">
                      <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="date"
                        value={milestone.endDate || ""}
                        onChange={(e) => {
                          const newEndDate = e.target.value;
                          const updates: Partial<MilestoneFormData> = {
                            endDate: newEndDate,
                          };

                          // Calculate duration if start date exists
                          if (milestone.startDate && newEndDate) {
                            const start = new Date(milestone.startDate);
                            const end = new Date(newEndDate);
                            const diffTime = end.getTime() - start.getTime();
                            // Add 1 day for inclusive count
                            const diffDays =
                              Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                            if (diffDays >= 0) {
                              updates.estimatedDays = diffDays;
                            }
                          }

                          updateMilestone(milestone.id, null, updates);

                          if (
                            validationErrors[
                              `milestone-${milestone.id}-endDate`
                            ]
                          ) {
                            setValidationErrors((prev) => {
                              const next = { ...prev };
                              delete next[`milestone-${milestone.id}-endDate`];
                              return next;
                            });
                          }
                        }}
                        className={`w-full pl-10 p-2 border ${
                          validationErrors[`milestone-${milestone.id}-endDate`]
                            ? "border-red-500"
                            : "border-gray-300"
                        } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                      />
                    </div>
                    {validationErrors[`milestone-${milestone.id}-endDate`] && (
                      <p className="mt-1 text-sm text-red-600">
                        {validationErrors[`milestone-${milestone.id}-endDate`]}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Aşama Açıklaması *
                  </label>
                  <textarea
                    value={milestone.description}
                    onChange={(e) =>
                      updateMilestone(
                        milestone.id,
                        "description",
                        e.target.value
                      )
                    }
                    placeholder="Bu aşamada neler yapılacağını detaylı olarak açıklayın..."
                    rows={3}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teslimatlar *
                  </label>
                  <div className="space-y-2">
                    {milestone.deliverables.map(
                      (deliverable, deliverableIndex) => (
                        <div key={deliverableIndex} className="flex gap-2">
                          <input
                            type="text"
                            value={deliverable}
                            onChange={(e) =>
                              updateDeliverable(
                                milestone.id,
                                deliverableIndex,
                                e.target.value
                              )
                            }
                            placeholder="Örn: 5 sayfa wireframe dosyası (PDF formatında)"
                            className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          {milestone.deliverables.length > 1 && (
                            <button
                              onClick={() =>
                                removeDeliverable(
                                  milestone.id,
                                  deliverableIndex
                                )
                              }
                              className="text-red-500 hover:text-red-700 p-2"
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      )
                    )}
                    <button
                      onClick={() => addDeliverable(milestone.id)}
                      className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                    >
                      <FiPlus className="w-4 h-4" />
                      Teslimat Ekle
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add Milestone Button */}
          <button
            onClick={addMilestone}
            className="w-full mt-4 p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
          >
            <FiPlus className="w-5 h-5" />
            Yeni Aşama Ekle
          </button>

          {/* Summary */}
          <div
            className={`mt-8 p-4 ${
              validationErrors["budget"] || validationErrors["milestoneDays"]
                ? "bg-red-50 border-red-200"
                : "bg-blue-50 border-blue-200"
            } rounded-lg border`}
          >
            <h4
              className={`font-semibold ${
                validationErrors["budget"] || validationErrors["milestoneDays"]
                  ? "text-red-900"
                  : "text-blue-900"
              } mb-3`}
            >
              Plan Özeti
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span
                  className={
                    validationErrors["budget"]
                      ? "text-red-700"
                      : "text-blue-700"
                  }
                >
                  Toplam Aşama:
                </span>
                <span className="font-semibold ml-2">{milestones.length}</span>
              </div>
              <div>
                <span
                  className={
                    validationErrors["budget"]
                      ? "text-red-700"
                      : "text-blue-700"
                  }
                >
                  Toplam Ücret:
                </span>
                <span className="font-semibold ml-2">
                  {totalAmount.toLocaleString("tr-TR")} TL
                </span>
                {(acceptedBidAmount || projectBudget) && (
                  <span className="text-gray-500 ml-1">
                    /{" "}
                    {(acceptedBidAmount || projectBudget)?.toLocaleString(
                      "tr-TR"
                    )}{" "}
                    TL
                  </span>
                )}
              </div>
              <div>
                <span
                  className={
                    validationErrors["milestoneDays"]
                      ? "text-red-700"
                      : "text-blue-700"
                  }
                >
                  Tahmini Süre:
                </span>
                <span className="font-semibold ml-2">{totalDays} gün</span>
              </div>
            </div>
            {validationErrors["budget"] && (
              <p className="mt-2 text-sm text-red-600 font-medium">
                {validationErrors["budget"]}
              </p>
            )}
            {validationErrors["milestoneDays"] && (
              <p className="mt-2 text-sm text-red-600 font-medium">
                {validationErrors["milestoneDays"]}
              </p>
            )}
          </div>

          {/* Validation Messages */}
          {!validateForm() && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <FiAlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
              <div className="text-red-700 text-sm">
                <p className="font-medium">Eksik bilgiler var:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Plan türü, adı, açıklaması ve toplam süre zorunludur</li>
                  <li>Tüm aşama başlıkları ve açıklamaları doldurulmalı</li>
                  <li>Ücret ve süre bilgileri 0'dan büyük olmalı</li>
                  <li>
                    Her aşama için geçerli başlangıç ve bitiş tarihi gereklidir
                  </li>
                  <li>Her aşama için en az bir teslimat tanımlanmalı</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </fieldset>

      {/* Action Buttons */}
      <div className="flex gap-4 mt-8">
        {!hideSubmit && (
          <button
            onClick={handleSubmit}
            disabled={
              !validateForm() || isSubmitting || disableSubmit || readOnly
            }
            className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              "Gönderiliyor..."
            ) : disableSubmit ? (
              "Plan gönderildi, müşteri yanıtı bekleniyor"
            ) : (
              <>
                <FiCheckCircle className="w-5 h-5" />
                {submitLabel || "Planı Müşteriye Gönder"}
              </>
            )}
          </button>
        )}

        {onCancel && (
          <button
            onClick={onCancel}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
          >
            İptal
          </button>
        )}
      </div>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-start gap-2">
          <FiCheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
          <div className="text-green-800 text-sm">
            <p className="font-medium mb-1">Plan gönderildikten sonra:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>
                Müşteri planınızı inceleyip onaylayabilir veya revizyon
                isteyebilir
              </li>
              <li>İlk aşama ödemesi güvenli escrow sistemine yatırılacaktır</li>
              <li>Onay sonrası çalışmaya başlayabilirsiniz</li>
              <li>Her aşama tamamlandığında ödeme serbest bırakılacaktır</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ProjectPlanForm;
