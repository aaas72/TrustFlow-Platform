import { useOutletContext } from "react-router-dom";
import ProjectTimeline from "../../components/project/ProjectTimeline";
import type { ClientProjectDetailOutletContext } from "./ProjectDetailRoute";

export default function ClientTimelineTab() {
  const { project, projectStatus, milestones } =
    useOutletContext<ClientProjectDetailOutletContext>();

  const statusLabelTR = (status?: string | null) => {
    switch (status) {
      case "in_progress":
        return "devam ediyor";
      case "plan_submitted":
        return "plan gönderildi";
      case "approved":
        return "plan onaylandı";
      case "completed":
        return "tamamlandı";
      default:
        return "beklemede";
    }
  };

  if (projectStatus !== "in_progress") {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <p className="text-gray-600">
          Proje durumu: {statusLabelTR(projectStatus)}. Plan onaylandıktan ve
          uygulama başladıktan sonra zaman çizelgesi burada görüntülenecek.
        </p>
      </div>
    );
  }

  return (
    <ProjectTimeline
      milestones={milestones}
      projectStartDate={
        project.created_at ? new Date(project.created_at) : new Date()
      }
      userRole="client"
    />
  );
}
