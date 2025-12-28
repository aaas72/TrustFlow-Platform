import { useOutletContext } from "react-router-dom";
import MilestoneSystem from "../../components/project/MilestoneSystem";
import type { ClientProjectDetailOutletContext } from "./ProjectDetailRoute";

export default function ClientMilestonesTab() {
  const {
    milestones,
    onApproveMilestone,
    onFundMilestone,
    projectStatus,
    onRequestRevision,
  } = useOutletContext<ClientProjectDetailOutletContext>();

  if (projectStatus !== "in_progress" && projectStatus !== "plan_submitted") {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <p className="text-gray-500">
          Plan onaylandıktan ve uygulama başladıktan sonra aşamalar burada
          görüntülenir.
        </p>
      </div>
    );
  }

  return (
    <>
      <MilestoneSystem
        milestones={milestones}
        userRole="client"
        onApproveMilestone={onApproveMilestone}
        onFundMilestone={onFundMilestone}
        onRequestRevision={onRequestRevision}
      />
    </>
  );
}
