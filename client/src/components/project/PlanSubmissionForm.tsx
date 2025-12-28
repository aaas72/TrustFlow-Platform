import React, { useState } from "react";
import {
  FiPlus,
  FiTrash2,
  FiDollarSign,
  FiCalendar,
  FiFileText,
  FiCheckCircle,
  FiAlertCircle,
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

interface PlanSubmissionFormProps {
  projectTitle: string;
  projectDescription: string;
  onSubmitPlan: (plan: {
    summary?: string;
    steps: MilestoneFormData[];
  }) => void;
  onCancel?: () => void;
}

const PlanSubmissionForm: React.FC<PlanSubmissionFormProps> = ({
  projectTitle,
  projectDescription,
  onSubmitPlan,
  onCancel,
}) => {
  const [milestones, setMilestones] = useState<MilestoneFormData[]>([
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
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [planType, setPlanType] = useState("");
  const [planName, setPlanName] = useState("");
  const [planSummary, setPlanSummary] = useState("");
  const [totalEstimatedDays, setTotalEstimatedDays] = useState<number>(0);

  const addMilestone = () => {
    const newMilestone: MilestoneFormData = {
      id: Date.now().toString(),
      title: "",
      description: "",
      amount: 0,
      estimatedDays: 0,
      deliverables: [""],
    };
    setMilestones([...milestones, newMilestone]);
  };

  const removeMilestone = (id: string) => {
    if (milestones.length > 1) {
      setMilestones(milestones.filter((m) => m.id !== id));
    }
  };

  const updateMilestone = (
    id: string,
    field: keyof MilestoneFormData,
    value: any
  ) => {
    setMilestones(
      milestones.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
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
          ? {
              ...m,
              deliverables: m.deliverables.filter((_, i) => i !== index),
            }
          : m
      )
    );
  };

  const validateForm = () => {
    // Plan Meta validations
    if (!planType.trim()) return false;
    if (!planName.trim()) return false;
    if (!planSummary.trim()) return false;
    if (!totalEstimatedDays || totalEstimatedDays <= 0) return false;
    for (const milestone of milestones) {
      if (!milestone.title.trim()) return false;
      if (!milestone.description.trim()) return false;
      if (milestone.amount <= 0) return false;
      if (milestone.estimatedDays <= 0) return false;
      if (!milestone.startDate || !milestone.endDate) return false;
      const sd = new Date(milestone.startDate as string);
      const ed = new Date(milestone.endDate as string);
      if (ed.getTime() < sd.getTime()) return false;
      if (
        milestone.deliverables.length === 0 ||
        !milestone.deliverables.some((d) => d.trim())
      )
        return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      alert("Lütfen tüm alanları doldurun ve geçerli değerler girin.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Clean up deliverables (remove empty ones)
      const cleanedMilestones = milestones.map((m) => ({
        ...m,
        deliverables: m.deliverables.filter((d) => d.trim()),
      }));

      await onSubmitPlan({
        summary: planSummary,
        steps: cleanedMilestones,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalAmount = milestones.reduce((sum, m) => sum + m.amount, 0);
  const totalDays = milestones.reduce((sum, m) => sum + m.estimatedDays, 0);

  return (
    <div className="mx-auto bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="bg-linear-to-r from-blue-800 to-blue-600 text-white p-6 rounded-t-lg">
        <h2 className="text-2xl font-bold mb-2">
          Plan Sunumu - Şeffaf Yol Haritası Oluşturun
        </h2>
        <p className="text-purple-100">
          Projeyi aşamalara bölerek müşterinize net bir çalışma planı sunun
        </p>
      </div>

      {/* Project Info */}
      <div className="p-6 border-b border-gray-200 bg-gray-50">
        <h3 className="font-semibold text-gray-900 mb-2">{projectTitle}</h3>
        <p className="text-gray-600 text-sm">{projectDescription}</p>
      </div>

      {/* Plan Meta */}
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
                setTotalEstimatedDays(parseInt(e.target.value) || 0)
              }
              placeholder="Örnek: 30"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
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
            Her aşama için net teslimatlar, süre ve ücret belirleyin. Bu
            bilgiler müşteriye şeffaf bir çalışma planı sunar.
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
                        onChange={(e) =>
                          updateMilestone(
                            milestone.id,
                            "amount",
                            parseInt(e.target.value) || 0
                          )
                        }
                        placeholder="1000"
                        className="w-full pl-10 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Süre (Gün) *
                    </label>
                    <div className="relative">
                      <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="number"
                        value={milestone.estimatedDays || ""}
                        onChange={(e) =>
                          updateMilestone(
                            milestone.id,
                            "estimatedDays",
                            parseInt(e.target.value) || 0
                          )
                        }
                        placeholder="5"
                        className="w-full pl-10 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
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
                      onChange={(e) =>
                        updateMilestone(
                          milestone.id,
                          "startDate",
                          e.target.value
                        )
                      }
                      className="w-full pl-10 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
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
                      onChange={(e) =>
                        updateMilestone(milestone.id, "endDate", e.target.value)
                      }
                      className="w-full pl-10 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Aşama Açıklaması *
                </label>
                <textarea
                  value={milestone.description}
                  onChange={(e) =>
                    updateMilestone(milestone.id, "description", e.target.value)
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
                              removeDeliverable(milestone.id, deliverableIndex)
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
        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-semibold text-blue-900 mb-3">Plan Özeti</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-blue-700">Toplam Aşama:</span>
              <span className="font-semibold ml-2">{milestones.length}</span>
            </div>
            <div>
              <span className="text-blue-700">Toplam Ücret:</span>
              <span className="font-semibold ml-2">
                {totalAmount.toLocaleString("tr-TR")} TL
              </span>
            </div>
            <div>
              <span className="text-blue-700">Tahmini Süre:</span>
              <span className="font-semibold ml-2">{totalDays} gün</span>
            </div>
          </div>
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

        {/* Action Buttons */}
        <div className="flex gap-4 mt-8">
          <button
            onClick={handleSubmit}
            disabled={!validateForm() || isSubmitting}
            className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              "Gönderiliyor..."
            ) : (
              <>
                <FiCheckCircle className="w-5 h-5" />
                Planı Müşteriye Gönder
              </>
            )}
          </button>

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
              <p className="font-medium mb-1">Planınız gönderildikten sonra:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Müşteri planınızı inceleyecek ve onaylayacak</li>
                <li>
                  İlk aşama için ödeme güvenli escrow sistemine yatırılacak
                </li>
                <li>Onaydan sonra çalışmaya başlayabilirsiniz</li>
                <li>Her aşama tamamlandığında ödeme serbest bırakılacak</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanSubmissionForm;
