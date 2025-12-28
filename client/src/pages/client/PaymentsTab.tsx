import { useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import EscrowSystem, {
  type EscrowTransaction,
} from "../../components/project/EscrowSystem";
import type { ClientProjectDetailOutletContext } from "./ProjectDetailRoute";

export default function ClientPaymentsTab() {
  const { milestones, projectStatus } =
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

  const { transactions, totalProjectValue, totalHeld, totalReleased } =
    useMemo(() => {
      const total = milestones.reduce(
        (sum, m) => sum + (Number(m.amount) || 0),
        0
      );
      const tx: EscrowTransaction[] = milestones.map((m) => {
        let status: EscrowTransaction["status"] = "pending";

        if (m.status === "approved" || m.status === "completed") {
          status = "released";
        } else if (
          m.status === "funded" ||
          m.status === "in_progress" ||
          m.status === "submitted" ||
          m.status === "revision_requested"
        ) {
          status = "held";
        }

        return {
          id: `ms-${m.id}`,
          milestoneId: m.id,
          milestoneName: m.title,
          amount: Number(m.amount) || 0,
          status,
          createdAt: m.fundedAt || new Date(),
          releasedAt: m.approvedAt,
          description: m.description || "—",
        };
      });
      const held = tx
        .filter((t) => t.status === "held")
        .reduce((s, t) => s + t.amount, 0);
      const released = tx
        .filter((t) => t.status === "released")
        .reduce((s, t) => s + t.amount, 0);
      return {
        transactions: tx,
        totalProjectValue: total,
        totalHeld: held,
        totalReleased: released,
      };
    }, [milestones]);

  if (!milestones || milestones.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <p className="text-gray-600">
          Proje durumu: {statusLabelTR(projectStatus)}. Bu proje için henüz
          ödeme verisi bulunmuyor.
        </p>
      </div>
    );
  }

  if (
    projectStatus !== "in_progress" &&
    projectStatus !== "plan_submitted" &&
    projectStatus !== "completed"
  ) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <p className="text-gray-600">
          Proje durumu: {statusLabelTR(projectStatus)}. Plan onaylandıktan ve
          uygulama başladıktan sonra ödemeler burada görüntülenecek.
        </p>
      </div>
    );
  }

  return (
    <EscrowSystem
      transactions={transactions}
      totalProjectValue={totalProjectValue}
      totalHeld={totalHeld}
      totalReleased={totalReleased}
      userRole="client"
    />
  );
}
