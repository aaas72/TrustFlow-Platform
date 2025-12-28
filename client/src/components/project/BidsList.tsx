import { useEffect, useState } from "react";
import {
  getProjectBids,
  acceptBid,
  type BidItem,
} from "../../services/bidService";
import { Button } from "../index";
import {
  FiUser,
  FiDollarSign,
  FiClock,
  FiCheckCircle,
  FiFileText,
  FiAlertCircle,
} from "react-icons/fi";

interface BidsListProps {
  projectId: number;
}

export default function BidsList({ projectId }: BidsListProps) {
  const [bids, setBids] = useState<BidItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadBids = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getProjectBids(projectId);
      if (res.success) {
        setBids(res.bids);
      } else {
        setError("Teklifler getirilemedi");
      }
    } catch (e) {
      setError("Sunucu ile bağlantı hatası");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) loadBids();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const onAccept = async (bidId: number) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    const res = await acceptBid(bidId);
    if (res.success) {
      setSuccess(res.message || "Teklif kabul edildi ve proje başlatıldı");
      await loadBids();
    } else {
      setError(res.message || "Teklif kabul edilemedi");
    }
    setLoading(false);
  };

  // Helper to format delivery time cleanly
  const formatDuration = (val?: number | string) => {
    if (!val) return "-";
    // If it's a number, append " gün"
    if (typeof val === "number") return `${val} gün`;
    // If it's a string, check if it already has text
    const str = String(val).toLowerCase();
    if (str.includes("day") || str.includes("gün")) {
      // Try to extract just the number if needed, or just return as is but translated?
      // For now, just return as is but clean up double text if possible.
      // Simple fix: if it contains 'days', replace with 'gün'
      return str.replace("days", "gün").replace("day", "gün");
    }
    return `${val} gün`;
  };

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s === "accepted") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <FiCheckCircle className="mr-1.5 h-3 w-3" />
          Kabul Edildi
        </span>
      );
    }
    if (s === "rejected") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <FiAlertCircle className="mr-1.5 h-3 w-3" />
          Reddedildi
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        <FiClock className="mr-1.5 h-3 w-3" />
        Bekliyor
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-900">
          Bu proje için teklifler
        </h3>
        <Button variant="outline" size="sm" onClick={loadBids} disabled={loading}>
          Listeyi Güncelle
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-50 border border-green-100 rounded-lg text-green-700 text-sm">
          {success}
        </div>
      )}

      {bids.length === 0 && !loading && !error && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200 border-dashed">
          <p className="text-gray-500">Henüz bu projeye teklif verilmemiş.</p>
        </div>
      )}

      <div className="grid gap-4">
        {bids.map((b) => (
          <div
            key={b.id}
            className="bg-white border border-gray-200 rounded-xl p-5 hover:border-blue-600 transition-shadow duration-200"
          >
            <div className="flex flex-col md:flex-row md:items-start gap-5">
              {/* Left: Freelancer Info & Stats */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                      <FiUser className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">
                        {b.freelancer_name || `Freelancer #${b.freelancer_id}`}
                      </h4>
                      <div className="text-xs text-gray-500">
                        Profesyonel Üye
                      </div>
                    </div>
                  </div>
                  {b.status && b.status !== "pending" && (
                    <div>{getStatusBadge(b.status)}</div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                   <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                      <div className="text-xs text-green-600 font-medium mb-1 uppercase">Teklif Tutarı</div>
                      <div className="text-lg font-bold text-green-700 flex items-center">
                        <FiDollarSign className="mr-1" />
                        {Number(b.amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                      </div>
                   </div>
                   <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                      <div className="text-xs text-blue-600 font-medium mb-1 uppercase">Teslim Süresi</div>
                      <div className="text-lg font-bold text-blue-700 flex items-center">
                        <FiClock className="mr-1.5" />
                        {formatDuration(b.delivery_time ?? undefined)}
                      </div>
                   </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                   <div className="flex items-center text-gray-500 text-xs font-semibold uppercase mb-2">
                     <FiFileText className="mr-1.5" />
                     Teklif Detayı
                   </div>
                   <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                     {b.proposal}
                   </p>
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex md:flex-col gap-3 md:border-l md:border-gray-100 md:pl-5 md:w-48 shrink-0 justify-center">
                {String(b.status || "").toLowerCase() === "accepted" ? (
                   <div className="w-full py-2 bg-green-100 text-green-800 rounded text-center text-sm font-medium">
                     Onaylandı
                   </div>
                ) : (
                  <Button
                    variant="primary"
                    className="w-full justify-center"
                    onClick={() => onAccept(b.id)}
                    disabled={loading}
                  >
                    Teklifi Kabul Et
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
