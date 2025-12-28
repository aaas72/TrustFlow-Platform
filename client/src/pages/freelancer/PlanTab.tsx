import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import ProjectPlanForm from "../../components/project/ProjectPlanForm";
import type { ProjectDetailOutletContext } from "./ProjectDetailRoute";
import { getPlan } from "../../services/planService";
import { getFreelancerBids } from "../../services/bidService";

export default function PlanTab() {
  const { project, handlePlanSubmitted, planStatus, projectStatus } =
    useOutletContext<ProjectDetailOutletContext>();

  const [reviewNote, setReviewNote] = useState<string | null>(null);
  const [initialPlan, setInitialPlan] = useState<{
    summary?: string;
    steps: any[];
  } | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [freelancerBidDays, setFreelancerBidDays] = useState<
    number | undefined
  >(undefined);
  const [freelancerBidAmount, setFreelancerBidAmount] = useState<
    number | undefined
  >(undefined);

  useEffect(() => {
    const id = Number(project.id);
    if (!id) return;
    (async () => {
      const res = await getPlan(id);
      if (res.success && res.plan) {
        setReviewNote(res.plan.review_note || null);
        setInitialPlan(res.plan.plan_json || null);
      } else {
        setReviewNote(null);
        setInitialPlan(null);
      }
    })();
  }, [project.id, planStatus]);

  useEffect(() => {
    const rawUser = localStorage.getItem("user");
    if (!rawUser) return;
    const user = JSON.parse(rawUser);
    if (!user.id || !project.id) return;

    (async () => {
      try {
        const res = await getFreelancerBids(user.id);
        if (res.success && res.bids) {
          const myBid = res.bids.find(
            (b) => Number(b.project_id) === Number(project.id)
          );

          if (myBid) {
            if (myBid.delivery_time) {
              const m = String(myBid.delivery_time).match(/\d+/);
              if (m) setFreelancerBidDays(Number(m[0]));
            }
            if (myBid.amount) {
              setFreelancerBidAmount(Number(myBid.amount));
            }
          }
        }
      } catch (e) {
        console.error("Failed to fetch bid for default duration", e);
      }
    })();
  }, [project.id]);

  if (projectStatus === "completed") {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
        <p className="text-gray-700">
          Proje durumu: tamamlandı. Yeni plan gönderilemez veya düzenlenemez.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 ">
      {planStatus === "revision_requested" && reviewNote && (
        <div className="border border-amber-200 bg-amber-50 p-4 rounded-t-lg">
          <h3 className="text-sm font-semibold text-amber-800 mb-1">
            Revizyon Notu
          </h3>
          <p className="text-amber-900 text-sm">{reviewNote}</p>
        </div>
      )}
      {planStatus === "submitted" && (
        <div className="mx-4 mt-4 p-3 bg-blue-50 text-blue-700 rounded border border-blue-200">
          Plan gönderildi, müşteri yanıtı bekleniyor.
        </div>
      )}
      {planStatus === "approved" && (
        <div className="mx-4 mt-4 p-3 bg-green-50 text-green-700 rounded border border-green-200">
          Plan onaylandı. Alanlar kilitlendi ve gönderme butonu gizlendi.
        </div>
      )}
      {successMessage && (
        <div className="mx-4 mt-4 p-3 bg-green-50 text-green-700 rounded border border-green-200">
          {successMessage}
        </div>
      )}
      <ProjectPlanForm
        key={`plan-form-${project.id}-${planStatus}-${
          initialPlan ? "has" : "none"
        }`}
        projectTitle={project.title}
        projectDescription={project.description}
        projectBudget={
          typeof project.budget === "string"
            ? parseFloat(project.budget)
            : project.budget || undefined
        }
        projectDeadline={project.deadline || undefined}
        projectStartDate={project.created_at || undefined}
        freelancerBidDeliveryDays={freelancerBidDays}
        acceptedBidAmount={freelancerBidAmount}
        onSubmitPlan={async (plan) => {
          await handlePlanSubmitted(plan);
          if (planStatus === "revision_requested") {
            setSuccessMessage(
              "Plan güncellendi ve müşteriye yeniden gönderildi"
            );
          } else {
            setSuccessMessage(null);
          }
        }}
        initialPlan={initialPlan || undefined}
        submitLabel={
          planStatus === "revision_requested"
            ? "Planı Güncelle ve Yeniden Gönder"
            : undefined
        }
        readOnly={planStatus === "approved"}
        disableSubmit={planStatus === "submitted"}
        hideSubmit={planStatus === "approved"}
      />
    </div>
  );
}
