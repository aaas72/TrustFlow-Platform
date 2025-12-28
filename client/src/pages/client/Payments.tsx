import { useEffect, useMemo, useState } from "react";
import {
  getUserPayments,
  type PaymentLedgerItem,
  getTransactions,
  type TransactionItem,
} from "../../services/paymentService";

type ProjectAggregate = {
  project_id: number;
  project_title?: string;
  freelancer_name?: string | number;
  total_amount: number;
  released_amount: number;
  pending_amount: number; // includes held/pending/failed
  payments_count: number;
  last_activity?: Date | null;
};

function formatMoney(n: number) {
  return n.toLocaleString("tr-TR") + "₺";
}

function formatDate(d?: Date | null | string) {
  return d ? new Date(d).toLocaleString() : "—";
}

export default function Payments() {
  const [items, setItems] = useState<PaymentLedgerItem[]>([]);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"payments" | "transactions">(
    "payments"
  );

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [paymentsRes, transactionsRes] = await Promise.all([
          getUserPayments(),
          getTransactions(),
        ]);

        if (paymentsRes.success) setItems(paymentsRes.payments || []);
        else console.error("Ödeme kayıtları alınamadı");

        if (transactionsRes.success)
          setTransactions(transactionsRes.transactions || []);
        else console.error("İşlem kayıtları alınamadı");
      } catch (e: any) {
        setError(e?.message || "Veriler alınamadı");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const aggregates = useMemo<ProjectAggregate[]>(() => {
    const map = new Map<number, ProjectAggregate>();
    for (const it of items) {
      const key = it.project_id;
      const curr = map.get(key) || {
        project_id: key,
        project_title: it.project_title,
        freelancer_name: it.freelancer_name || it.freelancer_id,
        total_amount: 0,
        released_amount: 0,
        pending_amount: 0,
        payments_count: 0,
        last_activity: null,
      };
      const amount = Number(it.amount) || 0;
      curr.total_amount += amount;
      const status = String(it.status || "").toLowerCase();
      if (status === "completed") curr.released_amount += amount;
      else curr.pending_amount += amount;
      curr.payments_count += 1;
      const ts = it.payment_paid_at || it.payment_created_at;
      const dt = ts ? new Date(ts) : null;
      if (!curr.last_activity || (dt && dt > curr.last_activity))
        curr.last_activity = dt;
      map.set(key, curr);
    }
    return Array.from(map.values()).sort((a, b) => {
      const ta = a.last_activity?.getTime() || 0;
      const tb = b.last_activity?.getTime() || 0;
      return tb - ta;
    });
  }, [items]);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800">
          Finansal Kayıtlar
        </h3>
        <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab("payments")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === "payments"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Ödemeler
          </button>
          <button
            onClick={() => setActiveTab("transactions")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === "transactions"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            İşlem Geçmişi (Ledger)
          </button>
        </div>
      </div>

      <div className="">
        {loading ? (
          <p className="text-gray-600">Yükleniyor...</p>
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : activeTab === "payments" ? (
          aggregates.length === 0 ? (
            <p className="text-gray-600">
              Herhangi bir ödeme kaydı bulunmuyor.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm border-separate border-spacing-y-2">
                <thead className="sticky top-0 z-10">
                  <tr className="text-left bg-gray-50 text-gray-700">
                    <th className="p-3">Proje</th>
                    <th className="p-3">Freelancer</th>
                    <th className="p-3">Ödeme Sayısı</th>
                    <th className="p-3">Toplam</th>
                    <th className="p-3">Serbest (Released)</th>
                    <th className="p-3">Bekleyen</th>
                    <th className="p-3">İlerleme</th>
                    <th className="p-3">Son İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {aggregates.map((pr) => {
                    const pct =
                      pr.total_amount > 0
                        ? Math.round(
                            (pr.released_amount / pr.total_amount) * 100
                          )
                        : 0;
                    return (
                      <tr
                        key={pr.project_id}
                        className="bg-white hover:bg-gray-50 border rounded-lg"
                      >
                        <td className="p-3 font-medium text-gray-900">
                          {pr.project_title || `#${pr.project_id}`}
                        </td>
                        <td className="p-3 text-gray-700">
                          {pr.freelancer_name}
                        </td>
                        <td className="p-3 text-gray-700">
                          {pr.payments_count}
                        </td>
                        <td className="p-3 text-gray-900">
                          {formatMoney(pr.total_amount)}
                        </td>
                        <td className="p-3 text-emerald-700">
                          {formatMoney(pr.released_amount)}
                        </td>
                        <td className="p-3 text-amber-700">
                          {formatMoney(pr.pending_amount)}
                        </td>
                        <td className="p-3 w-56">
                          <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500"
                              style={{ width: `${pct}%` }}
                              aria-label={`%${pct} released`}
                            />
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            {pct}% serbest bırakıldı
                          </div>
                        </td>
                        <td className="p-3 text-gray-700">
                          {formatDate(pr.last_activity)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        ) : transactions.length === 0 ? (
          <p className="text-gray-600">Herhangi bir işlem kaydı bulunmuyor.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border-separate border-spacing-y-2">
              <thead className="sticky top-0 z-10">
                <tr className="text-left bg-gray-50 text-gray-700">
                  <th className="p-3">ID</th>
                  <th className="p-3">Tarih</th>
                  <th className="p-3">Tür</th>
                  <th className="p-3">Açıklama</th>
                  <th className="p-3">Tutar</th>
                  <th className="p-3">Durum</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="bg-white hover:bg-gray-50 border rounded-lg"
                  >
                    <td className="p-3 text-gray-500">#{tx.id}</td>
                    <td className="p-3 text-gray-700">
                      {formatDate(tx.created_at)}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          tx.type === "credit"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {tx.type === "credit" ? "Gelir" : "Gider"}
                      </span>
                    </td>
                    <td className="p-3 text-gray-900">{tx.description}</td>
                    <td
                      className={`p-3 font-medium ${
                        tx.type === "credit"
                          ? "text-emerald-600"
                          : "text-red-600"
                      }`}
                    >
                      {tx.type === "credit" ? "+" : "-"}
                      {formatMoney(tx.amount)}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
