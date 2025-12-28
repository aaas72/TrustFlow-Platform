import React from "react";
import {
  FiDollarSign,
  FiClock,
  FiUser,
  FiCalendar,
} from "react-icons/fi";
import Button from "../../ui/Button";

interface AvailableProjectProps {
  id: number;
  title: string;
  budget: string;
  deadline: string;
  skills: string[];
  description?: string;
  clientName?: string;
  postedDate?: string;
  requirements?: string[];
  onApply?: () => void;
  applied?: boolean;
}

const AvailableProjectCard: React.FC<AvailableProjectProps> = ({
  id,
  title,
  budget,
  deadline,
  skills,
  description = "Bu proje için henüz detaylı açıklama eklenmemiştir.",
  clientName = "İsimsiz Müşteri",
  postedDate = "Bugün",
  requirements = ["Detaylar belirtilmemiş"],
  onApply,
  applied = false,
}) => {
  return (
    <div
      key={id}
      className="bg-white rounded-xl border border-gray-200 hover:border-blue-400 transition-all duration-200 w-full overflow-hidden group"
    >
      {/* Başlık Kısmı */}
      <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <h3 className="font-bold text-lg text-gray-900 group-hover:text-blue-600 transition-colors">
            {title}
          </h3>
          <div className="flex flex-wrap items-center text-sm text-gray-500 mt-2 gap-4">
            <div className="flex items-center">
              <FiUser className="h-4 w-4 mr-1.5 text-gray-400" />
              <span>{clientName}</span>
            </div>
            <div className="flex items-center">
              <FiCalendar className="h-4 w-4 mr-1.5 text-gray-400" />
              <span>{postedDate}</span>
            </div>
          </div>
        </div>
        <div className="shrink-0">
          <Button
            variant={applied ? "secondary" : "primary"}
            size="sm"
            onClick={onApply}
            disabled={applied}
            className={applied ? "opacity-70" : ""}
          >
            {applied ? "Başvuruldu" : "Başvur"}
          </Button>
        </div>
      </div>

      {/* İçerik Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-gray-100">
        {/* Birinci Sütun - Proje Detayları */}
        <div className="p-5 lg:col-span-3 flex flex-col gap-4 justify-center">
          <div>
            <div className="text-xs text-gray-500 font-medium uppercase mb-1">
              Bütçe
            </div>
            <div className="flex items-center text-gray-900 font-bold text-lg">
              <FiDollarSign className="h-5 w-5 text-green-600 mr-1" />
              {budget}
            </div>
          </div>

          <div>
            <div className="text-xs text-gray-500 font-medium uppercase mb-1">
              Teslim Süresi
            </div>
            <div className="flex items-center text-gray-900 font-medium">
              <FiClock className="h-4 w-4 text-orange-500 mr-1.5" />
              {deadline}
            </div>
          </div>
        </div>

        {/* İkinci Sütun - Proje Açıklaması */}
        <div className="p-5 lg:col-span-6">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">
            Proje Hakkında
          </h4>
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line line-clamp-4">
            {description}
          </p>
        </div>

        {/* Üçüncü Sütun - Beceriler */}
        <div className="p-5 lg:col-span-3 bg-gray-50/50 flex flex-col">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">
            Gerekli Beceriler
          </h4>
          <div className="flex flex-wrap gap-2">
            {skills.slice(0, 5).map((skill, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100"
              >
                {skill}
              </span>
            ))}
            {skills.length > 5 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium text-gray-500 bg-gray-100">
                +{skills.length - 5}
              </span>
            )}
          </div>

          <div className="mt-auto pt-4">
             <div className="text-xs text-gray-500">
                {requirements.length > 0 && requirements[0] !== "Detaylar belirtilmemiş" ? (
                   <>
                     <span className="font-medium">Gereksinimler: </span>
                     {requirements.length} madde
                   </>
                ) : (
                   <span className="italic opacity-75">Ek gereksinim yok</span>
                )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AvailableProjectCard;