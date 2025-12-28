import { useOutletContext } from "react-router-dom";
import EscrowSystem from "../../components/project/EscrowSystem";
import type { ProjectDetailOutletContext } from "./ProjectDetailRoute";

export default function PaymentsTab() {
  const { projectStatus, escrows } =
    useOutletContext<ProjectDetailOutletContext>();

  if (projectStatus !== "in_progress" && projectStatus !== "completed") {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <p className="text-gray-500">
          Bu bölüm plan onaylandıktan ve proje başladıktan sonra gösterilecek
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Ödemeler</h3>
      {escrows.length === 0 && (
        <div className="mb-4 p-3 rounded border border-blue-200 bg-blue-50 text-blue-700 text-sm">
          Bu projeye ait ödeme kaydı bulunmuyor. Proje tamamlanmış olabilir
          ancak ödeme hareketleri henüz oluşturulmamış. Ödeme yapıldıysa kısa
          süre içinde burada görünecektir.
        </div>
      )}
      <EscrowSystem
        transactions={escrows}
        userRole="freelancer"
        totalProjectValue={escrows.reduce((sum, tx) => sum + tx.amount, 0)}
        totalHeld={escrows.reduce(
          (sum, tx) => (tx.status === "held" ? sum + tx.amount : sum),
          0
        )}
        totalReleased={escrows.reduce(
          (sum, tx) => (tx.status === "released" ? sum + tx.amount : sum),
          0
        )}
      />
    </div>
  );
}
