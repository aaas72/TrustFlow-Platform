import { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  FiFileText,
  FiClock,
  FiAlertCircle,
  FiCalendar,
  FiList,
  FiTrendingUp,
  FiInfo,
  FiLayers,
  FiCheckSquare,
  FiCheckCircle,
} from "react-icons/fi";
import type { ClientProjectDetailOutletContext } from "./ProjectDetailRoute";

type PlanStep = {
  title: string;
  description?: string;
  amount?: number;
  estimatedDays?: number;
  deliverables?: string[];
};

function Badge({
  children,
  color = "gray",
  className = "",
}: {
  children: React.ReactNode;
  color?: "gray" | "blue" | "green" | "amber" | "red";
  className?: string;
}) {
  const map: Record<string, string> = {
    gray: "bg-gray-50 text-gray-600 border-gray-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    green: "bg-green-50 text-green-700 border-green-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    red: "bg-red-50 text-red-700 border-red-200",
  };
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-medium ${map[color]} ${className}`}
    >
      {children}
    </span>
  );
}

function formatCurrency(n?: number) {
  if (!n && n !== 0) return "";
  try {
    return Number(n).toLocaleString("tr-TR") + " TL";
  } catch {
    return `${n} TL`;
  }
}

function parseTurkishPlanSummary(
  summary?: string
): { label: string; value: string }[] {
  if (!summary) return [];
  const keys = [
    "Plan Türü",
    "Plan Adı",
    "Toplam Tahmini Süre (Gün)",
    "Hedefler",
    "Kapsam",
    "Başarı Kriterleri",
    "Genel Açıklama",
  ];
  const text = summary.replace(/\s+/g, " ").trim();
  const lowered = text.toLowerCase();
  const positions = keys
    .map((k) => {
      const idx = lowered.indexOf(k.toLowerCase());
      return idx >= 0 ? { label: k, idx } : null;
    })
    .filter(Boolean) as { label: string; idx: number }[];
  if (positions.length === 0) return [];
  positions.sort((a, b) => a.idx - b.idx);
  const rows: { label: string; value: string }[] = [];
  for (let i = 0; i < positions.length; i++) {
    const { label, idx } = positions[i];
    let start = idx + label.length;
    // Opsiyonel ":" ve boşlukları atla
    if (text[start] === ":") start++;
    while (text[start] === " ") start++;
    const end = i + 1 < positions.length ? positions[i + 1].idx : text.length;
    const value = text.slice(start, end).trim();
    rows.push({ label, value });
  }
  return rows;
}

export default function ClientPlanTab() {
  const { planStatus, plan, onApprovePlan, onRequestPlanRevision } =
    useOutletContext<ClientProjectDetailOutletContext>();

  // Revizyon talebi için modal durumu
  const [isRevisionOpen, setIsRevisionOpen] = useState(false);
  const [revisionNote, setRevisionNote] = useState("");

  const normalizedSteps: PlanStep[] = useMemo(() => {
    const raw = Array.isArray(plan?.steps) ? plan!.steps! : [];
    return raw.map((s: any) =>
      typeof s === "string"
        ? { title: s }
        : {
            title: String(s.title || "Adım"),
            description: s.description ? String(s.description) : undefined,
            amount: s.amount !== undefined ? Number(s.amount) : undefined,
            estimatedDays:
              s.estimatedDays !== undefined
                ? Number(s.estimatedDays)
                : undefined,
            deliverables: Array.isArray(s.deliverables)
              ? s.deliverables.map(String)
              : undefined,
          }
    );
  }, [plan]);

  const totals = useMemo(() => {
    const totalAmount = normalizedSteps.reduce(
      (sum, s) => sum + (s.amount || 0),
      0
    );
    const totalDays = normalizedSteps.reduce(
      (sum, s) => sum + (s.estimatedDays || 0),
      0
    );
    return { totalAmount, totalDays, count: normalizedSteps.length };
  }, [normalizedSteps]);

  const parsedSummary = useMemo(
    () => parseTurkishPlanSummary(plan?.summary),
    [plan?.summary]
  );

  // Özetten toplam gün bilgisi ve adımlara (المراحل) dağıtım
  const planSummaryDays = useMemo(() => {
    const row = parsedSummary.find(
      (r) => r.label === "Toplam Tahmini Süre (Gün)"
    );
    if (!row) return undefined;
    const m = String(row.value || "").match(/\d+/);
    return m ? Number(m[0]) : undefined;
  }, [parsedSummary]);

  const computedSteps = useMemo(() => {
    const knownSum = normalizedSteps.reduce(
      (sum, s) => sum + (s.estimatedDays || 0),
      0
    );
    const unknownIdx: number[] = [];
    const daysArr = normalizedSteps.map((s, i) => {
      if (!s.estimatedDays || s.estimatedDays <= 0) {
        unknownIdx.push(i);
        return 0;
      }
      return s.estimatedDays;
    });
    if (planSummaryDays !== undefined && unknownIdx.length > 0) {
      const remaining = Math.max(0, planSummaryDays - knownSum);
      const base =
        unknownIdx.length > 0 ? Math.floor(remaining / unknownIdx.length) : 0;
      let extra = unknownIdx.length > 0 ? remaining % unknownIdx.length : 0;
      unknownIdx.forEach((i) => {
        daysArr[i] = base + (extra > 0 ? 1 : 0);
        if (extra > 0) extra--;
      });
    }
    const withMin = daysArr.map((d) => (d > 0 ? d : 1));
    return normalizedSteps.map((s, i) => ({
      ...s,
      estimatedDays: withMin[i],
      _autoAssigned: !s.estimatedDays || s.estimatedDays <= 0,
    }));
  }, [normalizedSteps, planSummaryDays]);

  const computedTotalDays = useMemo(
    () => computedSteps.reduce((sum, s) => sum + (s.estimatedDays || 0), 0),
    [computedSteps]
  );
  const daysMismatch =
    planSummaryDays !== undefined && computedTotalDays !== planSummaryDays;

  const hasPlanSteps = normalizedSteps.length > 0;

  const statusBadge =
    planStatus === "approved" ? (
      <Badge color="green">Plan onaylandı</Badge>
    ) : planStatus === "submitted" ? (
      <Badge color="blue">Ön plan alındı</Badge>
    ) : planStatus === "revision_requested" ? (
      <Badge color="amber">Plan için revizyon talep edildi</Badge>
    ) : (
      <Badge color="gray">Plan yok</Badge>
    );

  return (
    <div className="space-y-6">
      {/* Status Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-lg ${
              planStatus === "approved"
                ? "bg-green-100 text-green-600"
                : "bg-blue-100 text-blue-600"
            }`}
          >
            <FiFileText className="text-xl" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Proje Planı</h2>
            <p className="text-sm text-gray-500">
              Mevcut planın detayları ve durumu
            </p>
          </div>
        </div>
        {statusBadge}
      </div>

      {planStatus === "none" && (
        <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
          <FiLayers className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">
            Plan Bekleniyor
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Henüz serbest çalışandan bir plan sunulmadı.
          </p>
        </div>
      )}

      {planStatus !== "none" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Sol: Öz özet ve toplamlar (4 col) */}
          <section className="lg:col-span-4 space-y-6">
            {/* Plan Summary Card */}
            {plan?.summary && (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center gap-2">
                  <FiInfo className="text-blue-600" />
                  <h3 className="text-sm font-bold text-gray-900">
                    Plan Özeti
                  </h3>
                </div>
                <div className="p-4">
                  {parsedSummary.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                      {parsedSummary.map((row) => {
                        return (
                          <div
                            key={row.label}
                            className="py-2.5 first:pt-0 last:pb-0"
                          >
                            <dt className="text-xs font-medium mb-1 uppercase tracking-wide text-gray-500">
                              {row.label}
                            </dt>
                            <dd className="text-sm text-gray-900 font-semibold leading-relaxed">
                              {row.value || "-"}
                            </dd>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {plan.summary}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Totals Card */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center gap-2">
                <FiTrendingUp className="text-green-600" />
                <h3 className="text-sm font-bold text-gray-900">
                  Genel Toplamlar
                </h3>
              </div>
              <div className="p-4 grid grid-cols-2 gap-4">
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-xs text-blue-600 font-medium mb-1">
                    Toplam Adım
                  </p>
                  <p className="text-xl font-bold text-blue-900">
                    {totals.count}
                  </p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                  <p className="text-xs text-green-600 font-medium mb-1">
                    Tahmini Bütçe
                  </p>
                  <p className="text-xl font-bold text-green-900">
                    {formatCurrency(totals.totalAmount)}
                  </p>
                </div>
                <div className="col-span-2 p-3 bg-purple-50 rounded-lg border border-purple-100 flex justify-between items-center">
                  <div>
                    <p className="text-xs text-purple-600 font-medium mb-1">
                      Tahmini Süre
                    </p>
                    <p className="text-xl font-bold text-purple-900">
                      {computedTotalDays || 0} Gün
                    </p>
                  </div>
                  <FiClock className="text-purple-200 text-4xl" />
                </div>
              </div>

              {planSummaryDays !== undefined && (
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600 font-medium">
                      Süre Tutarlılığı:
                    </span>
                    <Badge
                      color={daysMismatch ? "red" : "green"}
                      className="ml-2"
                    >
                      {daysMismatch ? "Uyumsuzluk Var" : "Uyumlu"}
                    </Badge>
                  </div>
                  <div className="mt-2 flex justify-between text-xs text-gray-500">
                    <span>Plan: {planSummaryDays} gün</span>
                    <span>Aşamalar: {computedTotalDays} gün</span>
                  </div>
                </div>
              )}
            </div>

            {/* İşlemler (Actions) */}
            {planStatus === "submitted" && (
              <div className="flex flex-col gap-3">
                {onApprovePlan && (
                  <button
                    onClick={onApprovePlan}
                    className="w-full px-4 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700  hover:shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <FiCheckCircle className="text-lg" />
                    Planı Onayla ve Başlat
                  </button>
                )}
                {onRequestPlanRevision && (
                  <button
                    onClick={() => setIsRevisionOpen(true)}
                    className="w-full px-4 py-3 bg-white text-gray-700 font-semibold rounded-xl border border-gray-300 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <FiAlertCircle className="text-lg" />
                    Revizyon Talep Et
                  </button>
                )}
              </div>
            )}

            {planStatus === "revision_requested" && plan?.review_note && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FiAlertCircle className="text-amber-600" />
                  <h3 className="text-sm font-bold text-amber-800">
                    Revizyon Notu
                  </h3>
                </div>
                <p className="text-amber-900 text-sm leading-relaxed">
                  {plan.review_note}
                </p>
              </div>
            )}
          </section>

          {/* Orta: Aşamaların Ayrıntıları (8 col) */}
          <section className="lg:col-span-8 space-y-6">
            {/* Steps List */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center gap-2">
                <FiList className="text-gray-600" />
                <h3 className="text-sm font-bold text-gray-900">
                  Aşamaların Ayrıntıları
                </h3>
              </div>
              <div className="p-4 space-y-4">
                {hasPlanSteps ? (
                  computedSteps.map((s, idx) => (
                    <div
                      key={idx}
                      className="group relative bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-all duration-200 "
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-l-lg"></div>
                      <div className="p-5 pl-6">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-bold rounded uppercase tracking-wider">
                                Aşama {idx + 1}
                              </span>
                              <h4 className="font-semibold text-gray-900 text-md">
                                {s.title}
                              </h4>
                            </div>
                            {s.description && (
                              <p className="text-gray-600 text-sm leading-relaxed mt-2">
                                {s.description}
                              </p>
                            )}
                          </div>
                          <div className="flex sm:flex-col items-center sm:items-end gap-2 sm:gap-1 text-right min-w-[120px]">
                            {s.amount !== undefined && (
                              <div className="font-bold text-gray-900 text-lg">
                                {formatCurrency(s.amount)}
                              </div>
                            )}
                            {s.estimatedDays !== undefined && (
                              <div className="flex items-center gap-1 text-gray-500 text-xs font-medium bg-gray-100 px-2 py-1 rounded-full">
                                <FiClock />≈ {s.estimatedDays} gün
                              </div>
                            )}
                          </div>
                        </div>

                        {Array.isArray(s.deliverables) &&
                          s.deliverables.length > 0 && (
                            <div className="mt-4 pt-3 border-t border-gray-100">
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                                <FiCheckSquare /> Beklenen Çıktılar
                              </p>
                              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {s.deliverables.map((d, i) => (
                                  <li
                                    key={i}
                                    className="flex items-start gap-2 text-sm text-gray-700"
                                  >
                                    <span>- {d}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                        {s._autoAssigned && (
                          <p className="mt-2 text-[10px] text-gray-400 italic text-right">
                            * Süre toplam plandan otomatik hesaplandı
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    Planda aşama detayları bulunmuyor.
                  </p>
                )}
              </div>
            </div>

            {/* Zaman çizelgesi (aşama günlerine göre) */}
            {hasPlanSteps && (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center gap-2">
                  <FiCalendar className="text-indigo-600" />
                  <h3 className="text-sm font-bold text-gray-900">
                    Zaman Çizelgesi (Tahmini)
                  </h3>
                </div>
                <div className="p-6">
                  <div className="flex items-stretch w-full overflow-hidden rounded-lg border border-gray-200 h-16 shadow-inner bg-gray-50">
                    {computedSteps.map((s, idx) => {
                      const weight =
                        s.estimatedDays && s.estimatedDays > 0
                          ? s.estimatedDays
                          : 1;
                      const colorPool = [
                        "bg-blue-500",
                        "bg-indigo-500",
                        "bg-violet-500",
                        "bg-purple-500",
                        "bg-fuchsia-500",
                      ];
                      const color = colorPool[idx % colorPool.length];
                      return (
                        <div
                          key={`tl-${idx}`}
                          className={`${color} flex-1 min-w-[60px] p-2 border-r border-white/20 relative group transition-all hover:brightness-110`}
                          style={{ flexGrow: weight }}
                        >
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                            <span className="text-xs font-bold truncate px-1 w-full text-center">
                              {s.title}
                            </span>
                            <span className="text-[10px] opacity-90">
                              {s.estimatedDays} gün
                            </span>
                          </div>
                          {/* Tooltip */}
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-10">
                            {s.title} • {s.estimatedDays} gün
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-gray-400 font-mono">
                    <span>Başlangıç</span>
                    <span>Toplam: {computedTotalDays} Gün</span>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      )}

      {/* Revizyon Talep Modalı */}
      {isRevisionOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setIsRevisionOpen(false)}
        >
          <div
            className="bg-white text-gray-900 rounded-2xl p-6 w-full max-w-lg shadow-2xl transform transition-all"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center gap-3 mb-4 text-amber-600">
              <FiAlertCircle className="text-2xl" />
              <h4 className="text-lg font-bold text-gray-900">
                Revizyon Talebi
              </h4>
            </div>

            <p className="text-gray-600 text-sm mb-3">
              Lütfen planda yapılmasını istediğiniz değişiklikleri detaylı bir
              şekilde açıklayın.
            </p>

            <textarea
              className="w-full rounded-xl border border-gray-300 bg-gray-50 p-4 text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all outline-none resize-none"
              rows={5}
              value={revisionNote}
              onChange={(e) => setRevisionNote(e.target.value)}
              placeholder="Örn: 2. aşamadaki teslimat süresi çok kısa, lütfen tekrar değerlendirin..."
            />

            <div className="mt-6 flex justify-end gap-3">
              <button
                className="px-5 py-2.5 bg-white text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                onClick={() => setIsRevisionOpen(false)}
              >
                İptal
              </button>
              <button
                className="px-5 py-2.5 bg-amber-600 text-white font-medium rounded-lg hover:bg-amber-700 shadow-lg shadow-amber-100 transition-colors"
                onClick={() => {
                  const v = revisionNote.trim();
                  if (!v) return;
                  onRequestPlanRevision?.(v);
                  setIsRevisionOpen(false);
                  setRevisionNote("");
                }}
              >
                Revizyon Gönder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
