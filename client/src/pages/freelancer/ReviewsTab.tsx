import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { FiStar, FiArrowRight } from "react-icons/fi";
import type { ProjectDetailOutletContext } from "./ProjectDetailRoute";
import {
  createReview,
  getProjectReviews,
  type Review,
} from "../../services/reviewService";

export default function FreelancerReviewsTab() {
  const { project } = useOutletContext<ProjectDetailOutletContext>();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Form state
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    const u = localStorage.getItem("user");
    if (u) {
      setCurrentUser(JSON.parse(u));
    }
    loadReviews();
  }, [project.id]);

  const loadReviews = async () => {
    setLoading(true);
    const res = await getProjectReviews(project.id);
    if (res.success) {
      setReviews(res.reviews);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setSubmitting(true);
    setMsg(null);

    const res = await createReview(project.id, rating, comment);
    if (res.success) {
      setMsg({ type: "success", text: "Değerlendirme başarıyla gönderildi!" });
      setComment("");
      setRating(5);
      loadReviews();
    } else {
      setMsg({ type: "error", text: res.message });
    }
    setSubmitting(false);
  };

  const isCompleted = String(project.status).toLowerCase() === "completed";
  const hasReviewed = reviews.some((r) => r.reviewer_id === currentUser?.id);
  const averageRating =
    reviews.length > 0
      ? (
          reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
        ).toFixed(1)
      : "0.0";

  return (
    <div className="space-y-8">
      {/* Header Stats */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900">
            Proje Değerlendirmeleri
          </h3>
          <p className="text-gray-500 text-sm mt-1">
            Toplam {reviews.length} değerlendirme
          </p>
        </div>
        {reviews.length > 0 && (
          <div className="flex items-center gap-4 bg-yellow-50 px-6 py-3 rounded-xl border border-yellow-100">
            <div className="text-3xl font-bold text-yellow-600">
              {averageRating}
            </div>
            <div className="flex flex-col">
              <div className="flex text-yellow-400 text-lg">
                {[...Array(5)].map((_, i) => (
                  <FiStar
                    key={i}
                    fill={
                      i < Math.round(Number(averageRating))
                        ? "currentColor"
                        : "none"
                    }
                  />
                ))}
              </div>
              <span className="text-xs text-yellow-700 font-medium mt-0.5">
                Ortalama Puan
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Reviews List */}
      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-500">Değerlendirmeler yükleniyor...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200 border-dashed">
            <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiStar className="w-8 h-8 text-gray-400" />
            </div>
            <h4 className="text-lg font-medium text-gray-900">
              Henüz değerlendirme yok
            </h4>
            <p className="text-gray-500 mt-1">
              Bu proje için henüz kimse değerlendirme yapmamış.
            </p>
          </div>
        ) : (
          reviews.map((r) => (
            <div
              key={r.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                    {(r.reviewer_name || "?").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-gray-900">
                        {r.reviewer_name || "İsimsiz"}
                      </h4>
                      <FiArrowRight className="text-gray-400 text-xs" />
                      <span className="text-sm text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
                        {r.reviewee_name || "Karşı Taraf"}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(r.created_at).toLocaleDateString("tr-TR", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
                <div className="flex bg-yellow-50 px-2 py-1 rounded-lg border border-yellow-100">
                  {[...Array(5)].map((_, i) => (
                    <FiStar
                      key={i}
                      className="w-4 h-4"
                      fill={i < r.rating ? "#CA8A04" : "none"}
                      stroke={i < r.rating ? "#CA8A04" : "#D1D5DB"}
                    />
                  ))}
                </div>
              </div>
              <div className="pl-16">
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {r.comment}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Review Form Section */}
      {isCompleted && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gray-50">
            <h3 className="text-lg font-bold text-gray-900">
              Değerlendirme Yap
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Deneyiminizi paylaşın ve karşı tarafı değerlendirin
            </p>
          </div>

          <div className="p-8">
            {hasReviewed ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiStar className="w-8 h-8 fill-current" />
                </div>
                <h4 className="text-lg font-bold text-green-800 mb-2">
                  Teşekkürler!
                </h4>
                <p className="text-green-700">
                  Bu proje için değerlendirmenizi zaten gönderdiniz.
                </p>
              </div>
            ) : (
              <>
                {msg && (
                  <div
                    className={`p-4 rounded-lg mb-6 flex items-center gap-3 ${
                      msg.type === "success"
                        ? "bg-green-50 text-green-700 border border-green-200"
                        : "bg-red-50 text-red-700 border border-red-200"
                    }`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${
                        msg.type === "success" ? "bg-green-500" : "bg-red-500"
                      }`}
                    ></div>
                    {msg.text}
                  </div>
                )}
                <form onSubmit={handleSubmit} className="max-w-3xl">
                  <div className="mb-8">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Puanınız
                    </label>
                    <div className="flex items-center gap-2 group">
                      {[1, 2, 3, 4, 5].map((v) => (
                        <button
                          type="button"
                          key={v}
                          onClick={() => setRating(v)}
                          className="focus:outline-none transition-transform hover:scale-110 active:scale-95"
                        >
                          <FiStar
                            className={`w-8 h-8 transition-colors ${
                              rating >= v
                                ? "text-yellow-400 fill-current"
                                : "text-gray-300 hover:text-yellow-200"
                            }`}
                          />
                        </button>
                      ))}
                      <span className="ml-4 text-lg font-bold text-gray-700">
                        {rating}/5
                      </span>
                    </div>
                  </div>

                  <div className="mb-8">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Yorumunuz
                    </label>
                    <textarea
                      className="w-full border border-gray-300 rounded-lg p-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none h-32"
                      placeholder="Bu proje ile ilgili deneyimleriniz nelerdi? (En az 10 karakter)"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      required
                      minLength={10}
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center justify-center px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow active:transform active:scale-95"
                  >
                    {submitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                        Gönderiliyor...
                      </>
                    ) : (
                      "Değerlendirmeyi Gönder"
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
