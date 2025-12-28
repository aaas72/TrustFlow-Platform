import { useOutletContext } from "react-router-dom";
import ProjectTimeline from "../../components/project/ProjectTimeline";
import type { ProjectDetailOutletContext } from "./ProjectDetailRoute";

export default function TimelineTab() {
  const { project, projectStatus, milestones } = useOutletContext<ProjectDetailOutletContext>();

  if (projectStatus !== "in_progress" && projectStatus !== "completed") {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <p className="text-gray-500">Bu bölüm plan onaylandıktan ve proje başladıktan sonra gösterilecek</p>
      </div>
    );
  }

  return (
    <ProjectTimeline 
      milestones={milestones} 
      projectStartDate={project.created_at ? new Date(project.created_at) : new Date()} 
      userRole="freelancer" 
    />
  );
}
