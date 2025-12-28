import { useRef, useState } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import type { ProjectDetailOutletContext } from "./ProjectDetailRoute";
import { addMilestoneAttachments } from "../../services/milestoneService";

export default function SubmitMilestonePage() {
  const navigate = useNavigate();
  const { id: projectId, mid } = useParams();
  const ctx = useOutletContext<ProjectDetailOutletContext>();
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!projectId || !mid) {
    return <div className="p-6 text-red-600">Geçersiz URL parametreleri</div>;
  }

  const milestone = ctx.milestones.find((m) => m.id === String(mid));
  if (!milestone) {
    return <div className="p-6 text-gray-600">Aşama bulunamadı</div>;
  }

  if (!milestone.fundedAt) {
    return (
      <div className="p-6 text-red-600">
        Bu aşama henüz finanse edilmedi. İş teslimi yapmadan önce ödeme
        yapılmalıdır.
      </div>
    );
  }

  const mergeFiles = (incoming: File[]) => {
    if (incoming.length === 0) return;
    setFiles((prev) => {
      const seen = new Set(
        prev.map((f) => `${f.name}-${f.lastModified}-${f.size}`)
      );
      const next: File[] = [...prev];
      for (const f of incoming) {
        const key = `${f.name}-${f.lastModified}-${f.size}`;
        if (!seen.has(key)) {
          seen.add(key);
          next.push(f);
        }
      }
      return next;
    });
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files ? Array.from(e.target.files) : [];
    mergeFiles(list);
    // reset value to allow re-selecting the same files
    if (e.target) e.target.value = "";
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const dt = e.dataTransfer;
    const list = dt?.files ? Array.from(dt.files) : [];
    mergeFiles(list);
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const formData = new FormData();
      files.forEach((file) => formData.append("attachments", file));
      const res = await addMilestoneAttachments(Number(mid), formData);
      if (!res.success) {
        setError(res.message || "Dosyalar yüklenemedi");
      } else {
        // Dosya yükleme işlemi sunucu tarafında durumu 'submitted' olarak günceller.
        // Bu yüzden tekrar updateMilestoneStatus çağırmaya gerek yoktur (çatışma yaratabilir).
        // Verileri tazelemek için refreshMilestones kullanıyoruz.
        if (ctx.refreshMilestones) {
          await ctx.refreshMilestones();
        }
        navigate(`/freelancer/projects/${projectId}/milestones`);
      }
    } catch (err: any) {
      setError(err?.message || "Bilinmeyen hata");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">
        Aşama Teslimi: {milestone.title}
      </h2>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Dosyalar</label>
          <div
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            className={
              `flex flex-col items-center justify-center w-full p-6 border-2 border-dashed rounded-lg transition ` +
              (isDragging
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 bg-gray-50")
            }
            role="button"
            tabIndex={0}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ")
                fileInputRef.current?.click();
            }}
          >
            <p className="text-sm text-gray-700">
              Dosyalarınızı buraya sürükleyip bırakın veya tıklayın
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Birden çok dosya desteklenir
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={onFileChange}
              className="sr-only"
            />
          </div>

          {files.length > 0 && (
            <ul className="mt-3 divide-y border border-gray-200 rounded">
              {files.map((f, idx) => (
                <li
                  key={`${f.name}-${f.lastModified}`}
                  className="flex items-center justify-between px-3 py-2"
                >
                  <div className="text-sm text-gray-700 truncate">
                    {f.name}{" "}
                    <span className="text-gray-400">
                      ({(f.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    className="text-red-600 text-sm hover:underline"
                  >
                    Kaldır
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting || files.length === 0}
            className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
          >
            {submitting ? "Gönderiliyor..." : "Teslim Et"}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 rounded border border-gray-300"
          >
            İptal
          </button>
        </div>
      </form>
    </div>
  );
}
