import { useOutletContext } from "react-router-dom";
import {
  FiDollarSign,
  FiClock,
  FiUser,
  FiTag,
  FiLayers,
  FiFileText,
} from "react-icons/fi";
import type { ProjectDetailOutletContext } from "./ProjectDetailRoute";

export default function OverviewTab() {
  const { project } = useOutletContext<ProjectDetailOutletContext>();
  return (
    <div className="space-y-6">
      {/* Main Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-8 border-b border-gray-100">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {project.title}
              </h2>
              <div className="flex items-center text-gray-500 text-sm">
                <span className="flex items-center mr-4">
                  <FiUser className="mr-1.5" />
                  {(project as any).client_name ?? "Müşteri"}
                </span>
                <span className="flex items-center">
                  <FiTag className="mr-1.5" />
                  Durum: {String(project.status ?? "—")}
                </span>
              </div>
            </div>
            <div className="flex items-center px-4 py-2 bg-green-50 text-green-700 rounded-lg border border-green-100">
              <FiDollarSign className="mr-2 text-lg" />
              <span className="text-lg font-bold">
                {project.budget != null
                  ? `${project.budget.toLocaleString()} ₺`
                  : "Belirtilmemiş"}
              </span>
            </div>
          </div>
        </div>

        <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Column: Details */}
          <div className="md:col-span-2 space-y-8">
            <div>
              <h3 className="flex items-center font-semibold text-gray-900 mb-4">
                <FiFileText className="mr-2 text-blue-600" />
                Proje Açıklaması
              </h3>
              <div className="text-gray-600 leading-relaxed whitespace-pre-line">
                {project.description}
              </div>
            </div>
          </div>

          {/* Right Column: Meta & Skills */}
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-4 text-sm uppercase tracking-wider">
                Proje Detayları
              </h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 mr-3 shrink-0">
                    <FiClock />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 font-medium">
                      Proje Süresi
                    </div>
                    <div className="text-sm font-semibold text-gray-900">
                      {(project as any).duration ?? "Belirtilmemiş"}
                    </div>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 mr-3 shrink-0">
                    <FiLayers />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 font-medium">
                      Kategori
                    </div>
                    <div className="text-sm font-semibold text-gray-900">
                      {(project as any).category ?? "Genel"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3 text-sm uppercase tracking-wider">
                Gerekli Beceriler
              </h3>
              <div className="flex flex-wrap gap-2">
                {((project as any).skills ?? []).map(
                  (skill: string, index: number) => (
                    <span
                      key={index}
                      className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-medium rounded-lg"
                    >
                      {skill}
                    </span>
                  )
                )}
                {(!(project as any).skills ||
                  (project as any).skills.length === 0) && (
                  <span className="text-gray-400 text-sm italic">
                    Belirtilmemiş
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
