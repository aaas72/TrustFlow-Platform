import React from "react";
import {
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiDollarSign,
  FiEye,
  FiEdit3,
  FiExternalLink,
} from "react-icons/fi";

export interface Milestone {
  id: string;
  title: string;
  description: string;
  amount: number;
  status:
    | "pending"
    | "funded"
    | "in_progress"
    | "submitted"
    | "revision_requested"
    | "approved"
    | "completed";
  deliverables: string[];
  deadline?: string; // ISO date string from API
  submittedFiles?: string[];
  submittedFileLinks?: { name: string; url: string }[];
  revisionNotes?: string;
  submittedAt?: Date;
  approvedAt?: Date;
  fundedAt?: Date;
}

interface MilestoneSystemProps {
  milestones: Milestone[];
  userRole: "client" | "freelancer";
  onApproveMilestone?: (milestoneId: string) => Promise<boolean | void>;
  onRequestRevision?: (
    milestoneId: string,
    notes: string
  ) => Promise<boolean | void>;
  onFundMilestone?: (milestoneId: string) => void;
  onSubmitMilestone?: (milestoneId: string, files: string[]) => void;
}

export default function MilestoneSystem({
  milestones,
  userRole,
  onApproveMilestone,
  onRequestRevision,
  onFundMilestone,
  onSubmitMilestone,
}: MilestoneSystemProps) {
  const [previewFile, setPreviewFile] = React.useState<{
    name: string;
    url: string;
  } | null>(null);

  const [revisionMilestone, setRevisionMilestone] = React.useState<
    string | null
  >(null);
  const [revisionNote, setRevisionNote] = React.useState("");

  const API_BASE =
    (typeof import.meta !== "undefined" &&
      (import.meta as any).env?.VITE_API_BASE_URL) ||
    "http://localhost:3000/api";
  const SERVER_ORIGIN = API_BASE.replace(/\/api\/?$/, "");

  const getStatusColor = (status: Milestone["status"]) => {
    switch (status) {
      case "pending":
        return "bg-white border-gray-200 hover:border-gray-300"; // Gray/Neutral

      case "funded":
      case "in_progress":
      case "submitted":
      case "revision_requested":
        return "bg-green-50/30 border-green-200 hover:border-green-300"; // Green/Current

      case "approved":
      case "completed":
        return "bg-blue-50/30 border-blue-200 hover:border-blue-300"; // Blue/Done

      default:
        return "bg-white border-gray-200";
    }
  };

  const getStatusBadge = (status: Milestone["status"]) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
            <FiClock className="mr-1.5 w-3.5 h-3.5" />
            Beklemede
          </span>
        );
      case "funded":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
            <FiDollarSign className="mr-1.5 w-3.5 h-3.5" />
            Finanse Edildi
          </span>
        );
      case "in_progress":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
            <FiCheckCircle className="mr-1.5 w-3.5 h-3.5" />
            Devam Ediyor
          </span>
        );
      case "submitted":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
            <FiAlertCircle className="mr-1.5 w-3.5 h-3.5" />
            Onay Bekliyor
          </span>
        );
      case "revision_requested":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
            <FiEdit3 className="mr-1.5 w-3.5 h-3.5" />
            Revizyon Gerekli
          </span>
        );
      case "approved":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200">
            <FiCheckCircle className="mr-1.5 w-3.5 h-3.5" />
            Onaylandı
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200">
            <FiCheckCircle className="mr-1.5 w-3.5 h-3.5" />
            Tamamlandı
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500 border border-gray-200">
            Bilinmiyor
          </span>
        );
    }
  };

  const preventContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  const renderPreview = (file: { name: string; url: string }) => {
    const url = file.url;
    // Use file name for extension detection as URL might be an API endpoint (e.g. /attachments/123)
    const name = file.name || "";
    const cleanExtMatch = name.split(".");
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
          className="max-h-[70vh] max-w-full object-contain select-none"
          draggable={false}
          onContextMenu={preventContextMenu}
        />
      );
    }
    if (isVideo) {
      return (
        <video
          src={url}
          className="w-full h-[70vh]"
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
          className="w-full h-[70vh]"
          sandbox="allow-same-origin allow-scripts"
        />
      );
    }
    return (
      <iframe
        src={url}
        className="w-full h-[70vh]"
        sandbox="allow-same-origin allow-scripts"
      />
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Proje Aşamaları
        </h2>
        <p className="text-gray-500 mb-8">
          Projenin ilerleyişini buradan takip edebilir, onaylayabilir ve
          ödemeleri yönetebilirsiniz.
        </p>

        <div className="space-y-4">
          {milestones.map((milestone, index) => (
            <div
              key={milestone.id}
              className={`group relative rounded-xl p-6 border transition-all duration-200 hover:shadow-sm ${getStatusColor(
                milestone.status
              )}`}
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                {/* Left Content */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-white text-gray-700 border border-gray-200 text-sm font-bold shadow-sm">
                      {index + 1}
                    </span>
                    <h3 className="text-lg font-bold text-gray-900">
                      {milestone.title}
                    </h3>
                    {getStatusBadge(milestone.status)}
                  </div>

                  <p className="text-gray-600 mb-4 pl-11 leading-relaxed text-sm">
                    {milestone.description}
                  </p>

                  <div className="pl-11 flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center text-gray-700 bg-white px-3 py-1.5 rounded border border-gray-200 shadow-sm">
                      <FiDollarSign className="mr-2 text-green-600" />
                      <span className="font-semibold">
                        {milestone.amount.toLocaleString("tr-TR")} ₺
                      </span>
                    </div>

                    {milestone.deadline && (
                      <div className="flex items-center text-gray-600 bg-white px-3 py-1.5 rounded border border-gray-200 shadow-sm">
                        <FiClock className="mr-2 text-orange-500" />
                        <span>
                          {new Date(milestone.deadline).toLocaleDateString(
                            "tr-TR"
                          )}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Deliverables */}
                  {milestone.deliverables &&
                    milestone.deliverables.length > 0 && (
                      <div className="mt-5 pl-11">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                          Teslimatlar
                        </h4>
                        <ul className="space-y-1.5">
                          {milestone.deliverables.map((deliverable, idx) => (
                            <li
                              key={idx}
                              className="flex items-center gap-2 text-sm text-gray-600"
                            >
                              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full shrink-0"></div>
                              {deliverable}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                  {/* Files & Revisions */}
                  <div className="pl-11 mt-4 space-y-3">
                    {/* DEBUG HELPER: Remove in production */}
                    {/* <div className="text-xs text-red-500">
                           Files: {milestone.submittedFileLinks?.length || 0} / {milestone.submittedFiles?.length || 0}
                        </div> */}

                    {milestone.submittedFileLinks?.length ||
                    milestone.submittedFiles?.length ? (
                      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                        <h4 className="font-semibold text-sm text-gray-800 mb-2 flex items-center">
                          <FiCheckCircle className="mr-2 text-green-500" />
                          Gönderilen Dosyalar
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {/* Handle submittedFileLinks */}
                          {milestone.submittedFileLinks &&
                          milestone.submittedFileLinks.length > 0
                            ? milestone.submittedFileLinks.map((f, idx) => (
                                <button
                                  key={`link-${idx}`}
                                  onClick={() =>
                                    setPreviewFile({ name: f.name, url: f.url })
                                  }
                                  className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded text-xs font-medium hover:bg-blue-100 transition-colors flex items-center"
                                >
                                  <FiEye className="mr-1.5" />
                                  {f.name}
                                </button>
                              ))
                            : // Fallback for when links are missing but files exist (e.g. legacy or error)
                              milestone.submittedFiles?.map((fName, idx) => (
                                <div
                                  key={`file-${idx}`}
                                  className="px-3 py-1.5 bg-gray-50 text-gray-600 rounded text-xs font-medium border border-gray-200 flex items-center"
                                  title="Önizleme bağlantısı mevcut değil"
                                >
                                  {fName}
                                </div>
                              ))}
                        </div>
                      </div>
                    ) : null}

                    {milestone.revisionNotes && (
                      <div className="bg-orange-50 p-4 rounded-lg border border-orange-100 text-sm text-orange-800">
                        <div className="flex items-center font-semibold mb-1">
                          <FiAlertCircle className="mr-2" />
                          Revizyon Talebi
                        </div>
                        <p>{milestone.revisionNotes}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions Column */}
                <div className="shrink-0 flex flex-col gap-2 min-w-[160px] md:border-l md:pl-6 md:border-gray-100 md:ml-4 justify-center">
                  {userRole === "client" && (
                    <>
                      {/* Fund Button: Show if pending OR (in_progress but not funded) */}
                      {(milestone.status === "pending" ||
                        (milestone.status === "in_progress" &&
                          !milestone.fundedAt)) &&
                        onFundMilestone && (
                          <button
                            onClick={() => onFundMilestone(milestone.id)}
                            className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-sm text-sm font-medium flex items-center justify-center"
                          >
                            <FiDollarSign className="mr-2" />
                            Finanse Et
                          </button>
                        )}

                      {/* Payment Completed State: Show if status implies progress AND is funded */}
                      {[
                        "funded",
                        "in_progress",
                        "submitted",
                        "revision_requested",
                        "approved",
                        "completed",
                      ].includes(milestone.status) &&
                        milestone.fundedAt && (
                          <button
                            disabled
                            className="w-full px-4 py-2.5 bg-green-600 text-white rounded-lg shadow-sm text-sm font-medium flex items-center justify-center cursor-default opacity-90"
                          >
                            <FiCheckCircle className="mr-2" />
                            Ödeme Yapıldı
                          </button>
                        )}

                      {milestone.status === "submitted" && (
                        <>
                          {onApproveMilestone && (
                            <button
                              onClick={() => onApproveMilestone(milestone.id)}
                              className="w-full px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all shadow-sm text-sm font-medium flex items-center justify-center"
                            >
                              <FiCheckCircle className="mr-2" />
                              Onayla
                            </button>
                          )}
                          {onRequestRevision && (
                            <button
                              onClick={() => {
                                setRevisionMilestone(milestone.id);
                                setRevisionNote("");
                              }}
                              className="w-full px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all text-sm font-medium flex items-center justify-center"
                            >
                              <FiEdit3 className="mr-2" />
                              Revizyon
                            </button>
                          )}
                        </>
                      )}
                    </>
                  )}

                  {userRole === "freelancer" && (
                    <>
                      {(milestone.status === "in_progress" ||
                        milestone.status === "funded" ||
                        milestone.status === "revision_requested") &&
                        milestone.fundedAt &&
                        onSubmitMilestone && (
                          <button
                            onClick={() => onSubmitMilestone(milestone.id, [])}
                            className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-sm text-sm font-medium flex items-center justify-center"
                          >
                            <FiCheckCircle className="mr-2" />
                            {milestone.status === "revision_requested"
                              ? "Tekrar Gönder"
                              : "Teslim Et"}
                          </button>
                        )}
                    </>
                  )}
                </div>
              </div>

              {/* Footer Timeline */}
              <div className="mt-6 pt-4 border-t border-gray-200/60 flex flex-wrap gap-4 text-xs text-gray-400">
                {milestone.fundedAt && (
                  <span className="flex items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 mr-1.5"></span>
                    Finanse:{" "}
                    {new Date(milestone.fundedAt).toLocaleDateString("tr-TR")}
                  </span>
                )}
                {milestone.submittedAt && (
                  <span className="flex items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 mr-1.5"></span>
                    Gönderildi:{" "}
                    {new Date(milestone.submittedAt).toLocaleDateString(
                      "tr-TR"
                    )}
                  </span>
                )}
                {milestone.approvedAt && (
                  <span className="flex items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mr-1.5"></span>
                    Onaylandı:{" "}
                    {new Date(milestone.approvedAt).toLocaleDateString("tr-TR")}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {previewFile && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center"
          onClick={() => setPreviewFile(null)}
        >
          <div
            className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900 truncate pr-4">
                {previewFile.name}
              </h3>
              <div className="flex items-center gap-2">
                <a
                  href={previewFile.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 hover:bg-gray-100 rounded-full text-gray-500 hover:text-blue-600 transition-colors"
                  title="Yeni sekmede aç / İndir"
                >
                  <FiExternalLink className="w-5 h-5" />
                </a>
                <button
                  onClick={() => setPreviewFile(null)}
                  className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-4 bg-gray-50 overflow-auto flex-1 flex items-center justify-center">
              {renderPreview(previewFile)}
            </div>
          </div>
        </div>
      )}

      {revisionMilestone && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center"
          onClick={() => {
            setRevisionMilestone(null);
            setRevisionNote("");
          }}
        >
          <div
            className="bg-white rounded-lg shadow-xl w-[90vw] max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4">Revizyon Talebi</h3>
            <p className="text-sm text-gray-600 mb-2">
              Lütfen revizyon nedenini ve notlarınızı girin:
            </p>
            <textarea
              className="w-full border rounded p-2 mb-4"
              rows={4}
              value={revisionNote}
              onChange={(e) => setRevisionNote(e.target.value)}
              placeholder="Revizyon notları..."
            />
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                onClick={() => {
                  setRevisionMilestone(null);
                  setRevisionNote("");
                }}
              >
                İptal
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={async () => {
                  if (onRequestRevision && revisionMilestone) {
                    const success = await onRequestRevision(
                      revisionMilestone,
                      revisionNote
                    );
                    if (success === false) {
                      alert(
                        "Revizyon talebi gönderilemedi. Lütfen tekrar deneyin."
                      );
                      return;
                    }
                  }
                  setRevisionMilestone(null);
                  setRevisionNote("");
                }}
              >
                Gönder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
