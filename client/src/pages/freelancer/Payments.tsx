import { useEffect, useState } from "react";
import {
  getUserPayments,
  type PaymentLedgerItem,
  getTransactions,
  type TransactionItem,
} from "../../services/paymentService";

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

      {loading ? (
        <p className="text-gray-600">Yükleniyor...</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : activeTab === "payments" ? (
        items.length === 0 ? (
          <p className="text-gray-600">Herhangi bir ödeme kaydı bulunmuyor.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left bg-gray-50">
                  <th className="p-2">Proje</th>
                  <th className="p-2">Aşama</th>
                  <th className="p-2">Tutar</th>
                  <th className="p-2">Durum</th>
                  <th className="p-2">Müşteri</th>
                  <th className="p-2">Tarih</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr key={it.payment_id} className="border-t">
                    <td className="p-2">
                      {it.project_title || `#${it.project_id}`}
                    </td>
                    <td className="p-2">
                      {it.milestone_title || `MS#${it.milestone_id}`}
                    </td>
                    <td className="p-2">
                      {Number(it.amount).toLocaleString()}₺
                    </td>
                    <td className="p-2 capitalize">{String(it.status)}</td>
                    <td className="p-2">{it.client_name || it.client_id}</td>
                    <td className="p-2">
                      {it.payment_paid_at || it.payment_created_at
                        ? new Date(
                            it.payment_paid_at || it.payment_created_at!
                          ).toLocaleString()
                        : "—"}
                    </td>
                  </tr>
                ))}
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
                    {tx.created_at
                      ? new Date(tx.created_at).toLocaleString()
                      : "—"}
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
                      tx.type === "credit" ? "text-emerald-600" : "text-red-600"
                    }`}
                  >
                    {tx.type === "credit" ? "+" : "-"}
                    {Number(tx.amount).toLocaleString()}₺
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
  );
}
