import React from "react";
import {
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiDollarSign,
  FiCalendar,
  FiUser,
  FiArrowRight,
} from "react-icons/fi";
import type { Milestone } from "./MilestoneSystem";

interface ProjectTimelineProps {
  milestones: Milestone[];
  projectStartDate: Date;
  userRole: "client" | "freelancer";
}

const ProjectTimeline: React.FC<ProjectTimelineProps> = ({
  milestones,
  projectStartDate,
  userRole,
}) => {
  const [previewFile, setPreviewFile] = React.useState<{
    name: string;
    url: string;
  } | null>(null);

  const preventContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  const renderPreview = (file: { name: string; url: string }) => {
    const url = file.url;
    const cleanExtMatch = url.split("?")[0].split("#")[0].split(".");
    const ext =
      cleanExtMatch.length > 1
        ? cleanExtMatch[cleanExtMatch.length - 1].toLowerCase()
        : "";
    const isImage = ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext);
    const isVideo = ["mp4", "webm", "ogg"].includes(ext);
    const isPdf = ext === "pdf";

    if (isImage) {
      return (
        <img
          src={url}
          alt={file.name}
          className="h-full w-full object-contain select-none"
          draggable={false}
          onContextMenu={preventContextMenu}
        />
      );
    }
    if (isVideo) {
      return (
        <video
          src={url}
          className="w-full h-full"
          controls
          onContextMenu={preventContextMenu}
        />
      );
    }
    if (isPdf) {
      const pdfUrl = `${url}#toolbar=0&navpanes=0&scrollbar=0`;
      return (
        <iframe
          src={pdfUrl}
          className="w-full h-full"
          sandbox="allow-same-origin allow-scripts"
        />
      );
    }
    return (
      <iframe
        src={url}
        className="w-full h-full"
        sandbox="allow-same-origin allow-scripts"
      />
    );
  };
  const getStatusColor = (status: Milestone["status"]) => {
    switch (status) {
      case "pending":
        return "border-gray-200 bg-gray-50 text-gray-400"; // Pending -> Gray

      case "funded":
      case "in_progress":
      case "submitted":
      case "revision_requested":
        return "border-green-200 bg-green-50 text-green-800"; // Current/Active -> Green

      case "approved":
      case "completed":
        return "border-blue-200 bg-blue-50 text-blue-800"; // Accomplished -> Blue

      default:
        return "border-gray-200 bg-gray-50 text-gray-400";
    }
  };

  const API_BASE =
    (typeof import.meta !== "undefined" &&
      (import.meta as any).env?.VITE_API_BASE_URL) ||
    "http://localhost:3000/api";
  const SERVER_ORIGIN = API_BASE.replace(/\/api\/?$/, "");

  const getStatusIcon = (status: Milestone["status"]) => {
    switch (status) {
      case "pending":
        return <FiClock className="w-5 h-5" />;
      case "funded":
        return <FiDollarSign className="w-5 h-5" />;
      case "in_progress":
        return <FiUser className="w-5 h-5" />;
      case "submitted":
        return <FiAlertCircle className="w-5 h-5" />;
      case "revision_requested":
        return <FiAlertCircle className="w-5 h-5" />;
      case "approved":
        return <FiCheckCircle className="w-5 h-5" />;
      case "completed":
        return <FiCheckCircle className="w-5 h-5" />;
      default:
        return <FiClock className="w-5 h-5" />;
    }
  };

  const getStatusText = (status: Milestone["status"]) => {
    switch (status) {
      case "pending":
        return "Beklemede";
      case "funded":
        return "Finanse Edildi";
      case "in_progress":
        return "Devam Ediyor";
      case "submitted":
        return "Onay Bekliyor";
      case "revision_requested":
        return "Revizyon Gerekli";
      case "approved":
        return "Onaylandı";
      case "completed":
        return "Tamamlandı";
      default:
        return "Bilinmiyor";
    }
  };

  const calculateEstimatedDate = (milestoneIndex: number) => {
    let totalDays = 0;
    for (let i = 0; i <= milestoneIndex; i++) {
      // Assuming each milestone takes 7 days on average if no specific data
      totalDays += 7;
    }
    const estimatedDate = new Date(projectStartDate);
    estimatedDate.setDate(estimatedDate.getDate() + totalDays);
    return estimatedDate;
  };

  // Consider both 'approved' and 'completed' as done for progress
  const completedMilestones = milestones.filter(
    (m) => m.status === "approved" || m.status === "completed"
  ).length;
  const totalMilestones = milestones.length;
  const progressPercentage =
    totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Proje Zaman Çizelgesi
        </h2>
        <p className="text-gray-600">
          Şeffaf ilerleme takibi ile her aşamanın durumunu görün
        </p>
      </div>

      {/* Progress Overview */}
      <div className="mb-8 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-700">
            Genel İlerleme
          </span>
          <span className="text-sm font-semibold text-blue-600">
            {completedMilestones}/{totalMilestones} Aşama Tamamlandı
          </span>
        </div>
        <div className="w-full bg-white rounded-full h-3 mb-2">
          <div
            className="bg-gradient-to-r from-blue-500 to-blue-800 h-3 rounded-full transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
        <div className="text-right text-sm text-gray-600">
          %{progressPercentage.toFixed(1)} Tamamlandı
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Timeline Line */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200"></div>

        <div className="space-y-6">
          {milestones.map((milestone, index) => {
            const estimatedDate = calculateEstimatedDate(index);
            const isActive = [
              "funded",
              "in_progress",
              "submitted",
              "revision_requested",
            ].includes(milestone.status);
            const isCompleted = ["approved", "completed"].includes(
              milestone.status
            );

            return (
              <div
                key={milestone.id}
                className="relative flex items-start gap-4"
              >
                {/* Timeline Node */}
                <div
                  className={`relative z-10 flex items-center justify-center w-16 h-16 rounded-full border-4 ${getStatusColor(
                    milestone.status
                  )}`}
                >
                  {getStatusIcon(milestone.status)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div
                    className={`p-4 rounded-lg border-2 ${
                      isActive
                        ? "border-blue-300 bg-blue-50"
                        : isCompleted
                        ? "border-green-300 bg-green-50"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">
                          Aşama {index + 1}: {milestone.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {milestone.description}
                        </p>
                      </div>
                      <div className="text-right ml-4">
                        <div className="font-semibold text-gray-900">
                          {milestone.amount.toLocaleString("tr-TR")} TL
                        </div>
                        <div
                          className={`text-xs px-2 py-1 rounded-full ${getStatusColor(
                            milestone.status
                          )}`}
                        >
                          {getStatusText(milestone.status)}
                        </div>
                      </div>
                    </div>

                    {/* Timeline Info */}
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-1">
                        <FiCalendar className="w-4 h-4" />
                        <span>
                          Tahmini: {estimatedDate.toLocaleDateString("tr-TR")}
                        </span>
                      </div>

                      {milestone.fundedAt && (
                        <div className="flex items-center gap-1">
                          <FiDollarSign className="w-4 h-4" />
                          <span>
                            Finanse:{" "}
                            {milestone.fundedAt.toLocaleDateString("tr-TR")}
                          </span>
                        </div>
                      )}

                      {milestone.submittedAt && (
                        <div className="flex items-center gap-1">
                          <FiUser className="w-4 h-4" />
                          <span>
                            Teslim:{" "}
                            {milestone.submittedAt.toLocaleDateString("tr-TR")}
                          </span>
                        </div>
                      )}

                      {milestone.approvedAt && (
                        <div className="flex items-center gap-1">
                          <FiCheckCircle className="w-4 h-4" />
                          <span>
                            Onay:{" "}
                            {milestone.approvedAt.toLocaleDateString("tr-TR")}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Deliverables */}
                    <div className="mb-3">
                      <h4 className="text-sm font-medium text-gray-700 mb-1">
                        Teslimatlar:
                      </h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {milestone.deliverables.map((deliverable, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                            {deliverable}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Submitted Files */}
                    {milestone.submittedFileLinks &&
                    milestone.submittedFileLinks.length > 0 ? (
                      <div className="mb-3">
                        <h4 className="text-sm font-medium text-gray-700 mb-1">
                          Gönderilen Dosyalar:
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {milestone.submittedFileLinks.map((f, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() =>
                                setPreviewFile({ name: f.name, url: f.url })
                              }
                              className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200"
                            >
                              {f.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : milestone.submittedFiles &&
                      milestone.submittedFiles.length > 0 ? (
                      <div className="mb-3">
                        <h4 className="text-sm font-medium text-gray-700 mb-1">
                          Gönderilen Dosyalar:
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {milestone.submittedFiles.map((file, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() =>
                                setPreviewFile({
                                  name: file,
                                  url: `${SERVER_ORIGIN}/uploads/milestones/${file}`,
                                })
                              }
                              className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200"
                            >
                              {file}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {/* Revision Notes */}
                    {milestone.revisionNotes && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded">
                        <h4 className="text-sm font-medium text-red-800 mb-1">
                          Revizyon Notları:
                        </h4>
                        <p className="text-sm text-red-700">
                          {milestone.revisionNotes}
                        </p>
                      </div>
                    )}

                    {/* Action Indicators */}
                    {userRole === "client" &&
                      milestone.status === "submitted" && (
                        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded flex items-center gap-2">
                          <FiAlertCircle className="w-4 h-4 text-yellow-600" />
                          <span className="text-sm text-yellow-800 font-medium">
                            Onayınız bekleniyor - Karar verin
                          </span>
                        </div>
                      )}

                    {userRole === "freelancer" &&
                      milestone.status === "funded" && (
                        <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded flex items-center gap-2">
                          <FiUser className="w-4 h-4 text-blue-600" />
                          <span className="text-sm text-blue-800 font-medium">
                            Çalışmaya başlayabilirsiniz
                          </span>
                        </div>
                      )}

                    {userRole === "freelancer" &&
                      milestone.status === "revision_requested" && (
                        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded flex items-center gap-2">
                          <FiAlertCircle className="w-4 h-4 text-red-600" />
                          <span className="text-sm text-red-800 font-medium">
                            Revizyon gerekli - Düzeltmeleri yapın
                          </span>
                        </div>
                      )}
                  </div>
                </div>

                {/* Arrow to next milestone */}
                {index < milestones.length - 1 && (
                  <div className="absolute left-8 -bottom-3 z-10 flex items-center justify-center w-6 h-6 bg-white border border-gray-300 rounded-full">
                    <FiArrowRight className="w-3 h-3 text-gray-400" />
                  </div>
                )}

                {previewFile && (
                  <div
                    className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center"
                    onClick={() => setPreviewFile(null)}
                  >
                    <div
                      className="bg-white rounded-lg shadow-xl w-[900px] h-[600px] max-w-[95vw] max-h-[90vh] overflow-hidden flex flex-col"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-between px-4 py-2 border-b">
                        <h3 className="text-sm font-semibold text-gray-800">
                          Dosya önizleme
                        </h3>
                        <button
                          type="button"
                          className="px-2 py-1 text-gray-600 hover:text-gray-800"
                          onClick={() => setPreviewFile(null)}
                        >
                          ✕
                        </button>
                      </div>
                      <div className="p-4 flex-1 h-full">
                        {renderPreview(previewFile)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary Footer */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">
              {totalMilestones}
            </div>
            <div className="text-sm text-gray-600">Toplam Aşama</div>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-700">
              {completedMilestones}
            </div>
            <div className="text-sm text-blue-600">Tamamlanan</div>
          </div>
          <div className="p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-700">
              {milestones
                .reduce(
                  (sum, m) =>
                    sum +
                    (["completed", "approved"].includes(m.status)
                      ? Number(m.amount)
                      : 0),
                  0
                )
                .toLocaleString("tr-TR")}{" "}
              TL
            </div>
            <div className="text-sm text-green-600">Ödenen Miktar</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectTimeline;
