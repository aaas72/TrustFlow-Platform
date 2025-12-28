import { useOutletContext, useNavigate, useParams } from "react-router-dom";
import MilestoneSystem from "../../components/project/MilestoneSystem";
import type { ProjectDetailOutletContext } from "./ProjectDetailRoute";

export default function MilestonesTab() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { projectStatus, planStatus, milestones } =
    useOutletContext<ProjectDetailOutletContext>();

  // Eğer plan henüz gönderilmediyse, bilgilendirme göster ve Plan sekmesine yönlendir
  if (planStatus === "none") {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <p className="text-gray-600">
          Lütfen önce planı Plan sekmesinden gönderin.
        </p>
      </div>
    );
  }

  // Proje devam ederken: gönderim erişimi açık
  if (projectStatus === "in_progress") {
    return (
      <MilestoneSystem
        milestones={milestones}
        userRole="freelancer"
        onSubmitMilestone={(mid) => {
          if (id) {
            navigate(`/freelancer/projects/${id}/milestones/${mid}/submit`);
          }
        }}
      />
    );
  }

  // Proje tamamlandı/iptal edildi: sadece görüntüleme (okuma فقط)
  if (projectStatus === "completed") {
    return (
      <div className="space-y-3">
        <div className="mx-4 mt-2 p-3 bg-green-50 text-green-700 rounded border border-green-200">
          Bu proje tamamlandı. Aşağıda aşamalar sadece görüntüleme amaçlıdır.
        </div>
        <MilestoneSystem milestones={milestones} userRole="freelancer" />
      </div>
    );
  }

  // Plan gönderilmiş ama proje henüz başlamadıysa bilgilendirme ver
  return (
    <div className="bg-white rounded-lg shadow-md p-6 text-center">
      <p className="text-gray-500">
        {planStatus === "submitted"
          ? "Plan gönderildi, müşteri onayı bekleniyor"
          : planStatus === "revision_requested"
          ? "Müşteri revizyon istedi, planı güncelleyin"
          : "Bu bölüm plan onaylandıktan ve proje başladıktan sonra gösterilecek"}
      </p>
    </div>
  );
}
